import type { Subscription } from "react-native-ble-plx";
import { deviceService } from "./deviceService/deviceService";
import { socketService } from "./socketService";

export const liveAudioDataService = (() => {
	let audioSubscription: Subscription | null = null;
	let audioSendInterval: NodeJS.Timeout | null = null;
	let audioPacketsBuffer: number[][] = [];
	let isSending = false;
	let sendInterval = 500;

	const sendAudioPackets = async (): Promise<void> => {
		if (audioPacketsBuffer.length === 0 || isSending) {
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
			socketService.getSocket().emit(
				"audioData",
				{
					packets: packets, // Send array of packets instead of concatenated buffer
					timestamp: Date.now(),
				},
				// (success: boolean) => {
				// 	if (success) {
				// 		savedAudioCount += packetsToSend.length;
				// 		console.log(
				// 			`Successfully sent ${packetsToSend.length} audio packets`,
				// 		);
				// 	} else {
				// 		console.error("Failed to send audio data, will retry later");
				// 		// Re-add the packets to the buffer for retry
				// 		audioPacketsBuffer = [...packetsToSend, ...audioPacketsBuffer];
				// 	}
				// 	isSending = false;
				// },
			);
			console.log(
				`[liveAudioDataService] ${packetsToSend.length} audio packets sent`,
			);
		} catch (error) {
			console.error("Error sending audio data:", error);
			// Re-add the packets to the buffer for retry
			audioPacketsBuffer = [...packetsToSend, ...audioPacketsBuffer];
		} finally {
			isSending = false;
		}
	};

	const startAudioCollection = async (): Promise<boolean> => {
		if (!deviceService.connectedDeviceId$.peek()) {
			console.error("Cannot start audio collection: Device not connected");
			return false;
		}

		// Reset state
		audioPacketsBuffer = [];

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
					}
				},
			);

			if (subscription) {
				audioSubscription = subscription;
				audioSendInterval = setInterval(sendAudioPackets, sendInterval);
				return true;
			}

			return false;
		} catch (error) {
			console.error("Error starting audio collection:", error);
			return false;
		}
	};

	const stopAudioCollection = async (): Promise<void> => {
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

	const setAudioSendInterval = (newInterval: number): number => {
		let intervalToSet = newInterval;

		if (intervalToSet < 20) {
			console.warn(
				"[liveAudioDataService] Interval too low, setting to minimum of 20ms",
			);
			intervalToSet = 20;
		}

		sendInterval = intervalToSet;

		if (audioSendInterval) {
			clearInterval(audioSendInterval);
			audioSendInterval = setInterval(sendAudioPackets, sendInterval);
		}

		console.log(
			`[liveAudioDataService] Send interval changed to ${sendInterval}ms`,
		);
		return sendInterval;
	};

	return {
		startAudioCollection,
		stopAudioCollection,
		setAudioSendInterval,
	};
})();
