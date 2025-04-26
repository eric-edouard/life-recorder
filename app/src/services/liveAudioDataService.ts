import type { Subscription } from "react-native-ble-plx";
import { deviceService } from "./deviceService/deviceService";
import { socketService } from "./socketService";

export const liveAudioDataService = (() => {
	let audioPacketsReceived = 0;
	let savedAudioCount = 0;
	let audioSubscription: Subscription | null = null;
	let audioSendInterval: NodeJS.Timeout | null = null;
	let updateStatsInterval: NodeJS.Timeout | null = null;
	let audioPacketsBuffer: number[][] = []; // Store processed bytes directly
	let onStatsUpdate:
		| ((packetsReceived: number, savedCount: number) => void)
		| null = null;
	let isSending = false;
	const sendInterval = 500;

	/**
	 * Send collected audio packets via socket.io
	 */
	const sendAudioPackets = async (): Promise<void> => {
		if (
			audioPacketsBuffer.length === 0 ||
			!socketService.isConnected() ||
			isSending
		) {
			return;
		}

		// Set flag to prevent concurrent sends
		isSending = true;

		// Create a copy of the current audio data
		const packetsToSend = [...audioPacketsBuffer];
		audioPacketsBuffer = []; // Clear the buffer immediately to avoid duplicate sends

		try {
			// Instead of concatenating, send an array of individual packets
			const packets = packetsToSend.map((packet) => Array.from(packet));

			// Get socket from service and send via socket.io
			const socket = socketService.getSocket();
			socket.emit(
				"audioData",
				{
					packets: packets, // Send array of packets instead of concatenated buffer
					timestamp: Date.now(),
				},
				(success: boolean) => {
					if (success) {
						savedAudioCount += packetsToSend.length;
						console.log(
							`Successfully sent ${packetsToSend.length} audio packets`,
						);
					} else {
						console.error("Failed to send audio data, will retry later");
						// Re-add the packets to the buffer for retry
						audioPacketsBuffer = [...packetsToSend, ...audioPacketsBuffer];
					}
					isSending = false;
				},
			);
		} catch (error) {
			console.error("Error sending audio data:", error);
			// Re-add the packets to the buffer for retry
			audioPacketsBuffer = [...packetsToSend, ...audioPacketsBuffer];
			isSending = false;
		}
	};

	/**
	 * Start collecting audio data from the connected device
	 * @param onStatsUpdate Optional callback to receive statistics updates
	 */
	const startAudioCollection = async (
		statsUpdateCallback?: (packetsReceived: number, savedCount: number) => void,
	): Promise<boolean> => {
		if (!deviceService.connectedDeviceId$.peek()) {
			console.error("Cannot start audio collection: Device not connected");
			return false;
		}

		// Reset state
		audioPacketsReceived = 0;
		savedAudioCount = 0;
		audioPacketsBuffer = [];
		onStatsUpdate = statsUpdateCallback || null;

		// Ensure socket is connected - use socket service for this
		if (!socketService.isConnected()) {
			await socketService.reconnectToServer();
		}

		try {
			// Start listening for audio packets - we now receive processed bytes directly
			const subscription = await deviceService.startAudioBytesListener(
				(processedBytes: number[]) => {
					// Store the processed bytes directly
					if (processedBytes.length > 0) {
						audioPacketsBuffer.push(processedBytes);
						audioPacketsReceived++;
					}
				},
			);

			if (subscription) {
				audioSubscription = subscription;

				// Set up stats update interval
				updateStatsInterval = setInterval(() => {
					if (onStatsUpdate) {
						onStatsUpdate(audioPacketsReceived, savedAudioCount);
					}
				}, 500);

				// Set up socket sending interval
				audioSendInterval = setInterval(sendAudioPackets, sendInterval);

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
	const stopAudioCollection = async (): Promise<void> => {
		// Clear intervals
		if (updateStatsInterval) {
			clearInterval(updateStatsInterval);
			updateStatsInterval = null;
		}

		if (audioSendInterval) {
			clearInterval(audioSendInterval);
			audioSendInterval = null;

			// Send any remaining audio data
			if (audioPacketsBuffer.length > 0) {
				await sendAudioPackets();
			}
		}

		// Stop the audio listener
		if (audioSubscription) {
			audioSubscription.remove();
			audioSubscription = null;
		}
	};

	return {
		startAudioCollection,
		stopAudioCollection,
	};
})();
