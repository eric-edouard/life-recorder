import type { Subscription } from "react-native-ble-plx";
import { type Socket, io } from "socket.io-client";
import { omiDeviceManager } from "./OmiDeviceManager/OmiDeviceManager";

export class AudioDataService {
	private audioPacketsReceived = 0;
	private savedAudioCount = 0;
	private isListening = false;
	private audioSubscription: Subscription | null = null;
	private audioSendInterval: NodeJS.Timeout | null = null;
	private updateStatsInterval: NodeJS.Timeout | null = null;
	private audioData: number[][] = []; // Store processed bytes directly
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
		this.socket = io(`https://${this.socketEndpoint}`, {
			transports: ["websocket", "polling"],
		});

		this.socket.on("connect", () => {
			console.log("Connected to socket server using WebSockets");
			// Log the active transport method
			if (this.socket) {
				const transport = this.socket.io.engine.transport.name;
				console.log(`Active transport method: ${transport}`);
			}
		});

		this.socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
		});

		this.socket.on("error", (error) => {
			console.error("Socket error:", error);
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
		this.audioData = [];
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
						this.audioData.push(processedBytes);
						this.audioPacketsReceived++;
					}
				},
			);

			if (subscription) {
				this.audioSubscription = subscription;
				this.isListening = true;

				// Set up stats update interval
				this.updateStatsInterval = setInterval(() => {
					if (this.onStatsUpdate) {
						this.onStatsUpdate(this.audioPacketsReceived, this.savedAudioCount);
					}
				}, 500);

				// Set up socket sending interval
				this.audioSendInterval = setInterval(
					this.sendAudioData,
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
			if (this.audioData.length > 0) {
				await this.sendAudioData();
			}
		}

		// Stop the audio listener
		if (this.audioSubscription) {
			await omiDeviceManager.stopAudioBytesListener(this.audioSubscription);
			this.audioSubscription = null;
		}

		this.isListening = false;
	};

	/**
	 * Send collected audio data via socket.io
	 */
	private sendAudioData = async (): Promise<void> => {
		if (
			this.audioData.length === 0 ||
			!this.socket?.connected ||
			this.isSending
		) {
			return;
		}

		// Set flag to prevent concurrent sends
		this.isSending = true;

		// Create a copy of the current audio data
		const packetsToSend = [...this.audioData];

		try {
			// Convert bytes arrays to a single ArrayBuffer
			const concatenatedAudio = this.convertBytesToArrayBuffer(packetsToSend);

			// Send via socket.io
			this.socket.emit(
				"audioData",
				{
					audio: concatenatedAudio,
					timestamp: Date.now(),
				},
				(success: boolean) => {
					if (success) {
						// Only clear the sent data after confirmation
						this.audioData = this.audioData.slice(packetsToSend.length);
						this.savedAudioCount += packetsToSend.length;
						console.log(
							`Successfully sent ${packetsToSend.length} audio packets`,
						);
					} else {
						console.error("Failed to send audio data, will retry later");
					}
					this.isSending = false;
				},
			);
		} catch (error) {
			console.error("Error sending audio data:", error);
			this.isSending = false;
		}
	};

	/**
	 * Convert array of byte arrays to a single ArrayBuffer
	 */
	private convertBytesToArrayBuffer = (
		bytesPackets: number[][],
	): ArrayBuffer => {
		// Calculate total length
		const totalLength = bytesPackets.reduce(
			(sum, packet) => sum + packet.length,
			0,
		);

		// Create a single buffer to hold all packets
		const result = new Uint8Array(totalLength);

		// Copy all packets into the result buffer
		let offset = 0;
		for (const packet of bytesPackets) {
			result.set(packet, offset);
			offset += packet.length;
		}

		return result.buffer;
	};
}

// Singleton instance export
export const audioDataService = new AudioDataService();
