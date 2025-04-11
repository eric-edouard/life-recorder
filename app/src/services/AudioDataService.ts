import type { Subscription } from "react-native-ble-plx";
import { omiDeviceManager } from "./OmiDeviceManager/OmiDeviceManager";

export class AudioDataService {
	private audioPacketsReceived = 0;
	private savedAudioCount = 0;
	private isListening = false;
	private audioSubscription: Subscription | null = null;
	private firebaseSaveInterval: NodeJS.Timeout | null = null;
	private updateStatsInterval: NodeJS.Timeout | null = null;
	private audioData: string[] = []; // Store base64 packets directly
	private onStatsUpdate:
		| ((packetsReceived: number, savedCount: number) => void)
		| null = null;
	private onRawAudioData: ((data: number[]) => void) | null = null;
	private firebaseEndpoint = "https://saveaudio-pu3kjmmxua-ez.a.run.app";

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

				// Set up Firebase function interval - send data every 5 seconds
				this.firebaseSaveInterval = setInterval(
					this.sendAudioToFirebaseFunction,
					5000,
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

		if (this.firebaseSaveInterval) {
			clearInterval(this.firebaseSaveInterval);
			this.firebaseSaveInterval = null;

			// Send any remaining audio data
			if (this.audioData.length > 0) {
				await this.sendAudioToFirebaseFunction();
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
	 * Send collected audio data to Firebase function
	 */
	private sendAudioToFirebaseFunction = async (): Promise<void> => {
		if (this.audioData.length === 0) {
			console.log("No audio data to send");
			return;
		}

		// Create a copy of the current audio data
		const packetsToSend = [...this.audioData];
		// Clear the audio data array to collect new packets
		this.audioData = [];

		console.log(
			`Sending ${packetsToSend.length} opus packets to Firebase function`,
		);

		try {
			// Send to Firebase function
			const response = await fetch(this.firebaseEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					opus_data_packets: packetsToSend,
				}),
			});

			if (response.ok) {
				// Update the saved count
				this.savedAudioCount += packetsToSend.length;
				console.log(`Successfully sent ${packetsToSend.length} audio packets`);
			} else {
				// Add the packets back to the beginning of the array if the request failed
				this.audioData = [...packetsToSend, ...this.audioData];
				const errorData = await response.json();
				console.error("Error sending audio data:", errorData);
			}
		} catch (error) {
			// Recover the packets that weren't sent due to an error by adding them back to the beginning
			this.audioData = [...packetsToSend, ...this.audioData];
			console.error("Error sending audio to Firebase function:", error);
		}
	};

	/**
	 * Check if audio collection is active
	 */
	isCollecting = (): boolean => {
		return this.isListening;
	};

	/**
	 * Get current audio collection statistics
	 */
	getStats = (): { packetsReceived: number; savedCount: number } => {
		return {
			packetsReceived: this.audioPacketsReceived,
			savedCount: this.savedAudioCount,
		};
	};

	/**
	 * Set the Firebase function endpoint
	 */
	setFirebaseEndpoint = (endpoint: string): void => {
		this.firebaseEndpoint = endpoint;
	};
}

// Singleton instance export
export const audioDataService = new AudioDataService();
