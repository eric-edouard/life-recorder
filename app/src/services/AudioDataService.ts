import type { Subscription } from "react-native-ble-plx";
import { atob } from "react-native-quick-base64";
import { type Socket, io } from "socket.io-client";
import { omiDeviceManager } from "./OmiDeviceManager/OmiDeviceManager";

export class AudioDataService {
	private audioPacketsReceived = 0;
	private savedAudioCount = 0;
	private isListening = false;
	private audioSubscription: Subscription | null = null;
	private audioSendInterval: NodeJS.Timeout | null = null;
	private updateStatsInterval: NodeJS.Timeout | null = null;
	private audioData: string[] = []; // Store base64 packets directly
	private onStatsUpdate:
		| ((packetsReceived: number, savedCount: number) => void)
		| null = null;
	private onRawAudioData: ((data: number[]) => void) | null = null;
	private socketEndpoint = "life-recorder-production.up.railway.app";
	private socket: Socket | null = null;
	private isSending = false;
	private sendInterval = 3000;

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
	 * Register a callback to receive raw audio data for transcription
	 * @param callback Function to receive raw audio bytes
	 */
	registerRawAudioCallback = (callback: (data: number[]) => void): void => {
		this.onRawAudioData = callback;
	};

	/**
	 * Unregister the raw audio callback
	 */
	unregisterRawAudioCallback = (): void => {
		this.onRawAudioData = null;
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
			// Start listening for audio packets
			const subscription = await omiDeviceManager.startAudioBytesListener(
				(bytes: number[], base64ValueWithHeader: string) => {
					// Store the original base64 data
					if (base64ValueWithHeader) {
						this.audioData.push(base64ValueWithHeader);
						this.audioPacketsReceived++;

						// Forward raw audio data to transcription service if registered
						if (this.onRawAudioData && bytes.length > 0) {
							this.onRawAudioData(bytes);
						}
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
			// Convert base64 data to ArrayBuffer
			const concatenatedAudio = this.convertBase64ToArrayBuffer(packetsToSend);

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
	 * Convert array of base64 strings to a single ArrayBuffer
	 */
	private convertBase64ToArrayBuffer = (
		base64Packets: string[],
	): ArrayBuffer => {
		// Decode all base64 packets and calculate total length
		const decodedPackets = base64Packets.map((packet) => {
			const bytes = atob(packet);
			const bytesArray = new Uint8Array([...bytes].map((c) => c.charCodeAt(0)));

			// Trim the first 3 bytes (header) from each packet
			return bytesArray.length > 3 ? bytesArray.slice(3) : bytesArray;
		});

		// Calculate total length
		const totalLength = decodedPackets.reduce(
			(sum, packet) => sum + packet.length,
			0,
		);

		// Create a single buffer to hold all packets
		const result = new Uint8Array(totalLength);

		// Copy all packets into the result buffer
		let offset = 0;
		for (const packet of decodedPackets) {
			result.set(packet, offset);
			offset += packet.length;
		}

		return result.buffer;
	};
}

// Singleton instance export
export const audioDataService = new AudioDataService();
