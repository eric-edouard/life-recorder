import { observable } from "@legendapp/state";
import type { Subscription } from "react-native-ble-plx";
import { type Socket, io } from "socket.io-client";
import { omiDeviceManager } from "./OmiDeviceManager/OmiDeviceManager";

// Connection states for the socket
export enum SocketConnectionState {
	DISCONNECTED = "disconnected",
	CONNECTING = "connecting",
	CONNECTED = "connected",
}

export class AudioDataService {
	// Observable for connection state
	public connectionState$ = observable<SocketConnectionState>(
		SocketConnectionState.DISCONNECTED,
	);

	private audioPacketsReceived = 0;
	private savedAudioCount = 0;
	private audioSubscription: Subscription | null = null;
	private audioSendInterval: NodeJS.Timeout | null = null;
	private updateStatsInterval: NodeJS.Timeout | null = null;
	private audioPacketsBuffer: number[][] = []; // Store processed bytes directly
	private onStatsUpdate:
		| ((packetsReceived: number, savedCount: number) => void)
		| null = null;
	private socketEndpoint = "life-recorder-production.up.railway.app";
	private socket: Socket | null = null;
	private isSending = false;
	private sendInterval = 1000;

	constructor() {
		this.initializeSocket();
	}

	/**
	 * Initialize Socket.IO connection
	 */
	private initializeSocket = (): void => {
		this.connectionState$.set(SocketConnectionState.CONNECTING);

		this.socket = io(`https://${this.socketEndpoint}`, {
			transports: ["websocket", "polling"],
		});

		this.socket.on("connect", () => {
			console.log("Connected to socket server using WebSockets");
			this.connectionState$.set(SocketConnectionState.CONNECTED);

			// Log the active transport method
			if (this.socket) {
				const transport = this.socket.io.engine.transport.name;
				console.log(`Active transport method: ${transport}`);
			}
		});

		this.socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			this.connectionState$.set(SocketConnectionState.DISCONNECTED);
		});

		this.socket.on("error", (error) => {
			console.error("Socket error:", error);
			this.connectionState$.set(SocketConnectionState.DISCONNECTED);
		});
	};

	/**
	 * Get the current socket transport method
	 * @returns The name of the current transport or null if not connected
	 */
	getCurrentTransport = (): string | null => {
		if (!this.socket?.connected) {
			return null;
		}
		return this.socket.io.engine.transport.name;
	};

	/**
	 * Manually reconnect to the socket server
	 * @returns Promise that resolves to true if reconnection was initiated
	 */
	reconnectToServer = async (): Promise<boolean> => {
		if (this.socket?.connected) {
			console.log("Already connected to server");
			return false;
		}

		// Disconnect existing socket if any
		if (this.socket) {
			this.socket.disconnect();
		}

		// Reinitialize socket connection
		this.initializeSocket();
		return true;
	};

	/**
	 * Start collecting audio data from the connected device
	 * @param onStatsUpdate Optional callback to receive statistics updates
	 */
	startAudioCollection = async (
		onStatsUpdate?: (packetsReceived: number, savedCount: number) => void,
	): Promise<boolean> => {
		if (!omiDeviceManager.isConnected()) {
			console.error("Cannot start audio collection: Device not connected");
			return false;
		}

		// Reset state
		this.audioPacketsReceived = 0;
		this.savedAudioCount = 0;
		this.audioPacketsBuffer = [];
		this.onStatsUpdate = onStatsUpdate || null;

		// Ensure socket is connected
		if (!this.socket?.connected) {
			this.initializeSocket();
		}

		try {
			// Start listening for audio packets - we now receive processed bytes directly
			const subscription = await omiDeviceManager.startAudioBytesListener(
				(processedBytes: number[]) => {
					// Store the processed bytes directly
					if (processedBytes.length > 0) {
						this.audioPacketsBuffer.push(processedBytes);
						this.audioPacketsReceived++;
					}
				},
			);

			if (subscription) {
				this.audioSubscription = subscription;

				// Set up stats update interval
				this.updateStatsInterval = setInterval(() => {
					if (this.onStatsUpdate) {
						this.onStatsUpdate(this.audioPacketsReceived, this.savedAudioCount);
					}
				}, 500);

				// Set up socket sending interval
				this.audioSendInterval = setInterval(
					this.sendAudioPackets,
					this.sendInterval,
				);

				return true;
			}

			return false;
		} catch (error) {
			console.error("Error starting audio collection:", error);
			return false;
		}
	};

	/**
	 * Stop collecting audio data and clean up resources
	 */
	stopAudioCollection = async (): Promise<void> => {
		// Clear intervals
		if (this.updateStatsInterval) {
			clearInterval(this.updateStatsInterval);
			this.updateStatsInterval = null;
		}

		if (this.audioSendInterval) {
			clearInterval(this.audioSendInterval);
			this.audioSendInterval = null;

			// Send any remaining audio data
			if (this.audioPacketsBuffer.length > 0) {
				await this.sendAudioPackets();
			}
		}

		// Stop the audio listener
		if (this.audioSubscription) {
			await omiDeviceManager.stopAudioBytesListener(this.audioSubscription);
			this.audioSubscription = null;
		}
	};

	/**
	 * Send collected audio packets via socket.io
	 */
	private sendAudioPackets = async (): Promise<void> => {
		if (
			this.audioPacketsBuffer.length === 0 ||
			!this.socket?.connected ||
			this.isSending
		) {
			return;
		}

		// Set flag to prevent concurrent sends
		this.isSending = true;

		// Create a copy of the current audio data
		const packetsToSend = [...this.audioPacketsBuffer];
		this.audioPacketsBuffer = []; // Clear the buffer immediately to avoid duplicate sends

		try {
			// Instead of concatenating, send an array of individual packets
			const packets = packetsToSend.map((packet) => Array.from(packet));

			// Send via socket.io
			this.socket.emit(
				"audioData",
				{
					packets: packets, // Send array of packets instead of concatenated buffer
					timestamp: Date.now(),
				},
				(success: boolean) => {
					if (success) {
						this.savedAudioCount += packetsToSend.length;
						console.log(
							`Successfully sent ${packetsToSend.length} audio packets`,
						);
					} else {
						console.error("Failed to send audio data, will retry later");
						// Re-add the packets to the buffer for retry
						this.audioPacketsBuffer = [
							...packetsToSend,
							...this.audioPacketsBuffer,
						];
					}
					this.isSending = false;
				},
			);
		} catch (error) {
			console.error("Error sending audio data:", error);
			// Re-add the packets to the buffer for retry
			this.audioPacketsBuffer = [...packetsToSend, ...this.audioPacketsBuffer];
			this.isSending = false;
		}
	};
}

// Singleton instance export
export const audioDataService = new AudioDataService();
