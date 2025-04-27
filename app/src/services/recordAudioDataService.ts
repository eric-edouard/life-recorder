import { observable } from "@legendapp/state";
import type { Subscription } from "react-native-ble-plx";
import { deviceService } from "./deviceService/deviceService";

export const recordAudioDataService = (() => {
	let audioPacketsReceived = 0;
	let audioSubscription: Subscription | null = null;
	let audioPacketsBuffer: number[][] = []; // Store processed bytes directly
	const isRecording$ = observable(false);

	/**
	 * Start recording audio data from the connected device
	 * @returns Promise<boolean> indicating if recording started successfully
	 */
	const startRecording = async (): Promise<boolean> => {
		if (!deviceService.connectedDeviceId$.peek()) {
			console.error("Cannot start audio recording: Device not connected");
			return false;
		}

		// If already recording, stop first
		if (isRecording$.peek()) {
			await stopRecording();
		}

		// Reset state
		audioPacketsReceived = 0;
		audioPacketsBuffer = [];
		isRecording$.set(true);

		try {
			// Start listening for audio packets
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
				console.log("Started audio recording");
				return true;
			}

			return false;
		} catch (error) {
			console.error("Error starting audio recording:", error);
			isRecording$.set(false);
			return false;
		}
	};

	/**
	 * Stop recording audio data and clean up resources
	 * @returns The collected audio packets
	 */
	const stopRecording = async (): Promise<number[][]> => {
		// Capture current buffer content
		const recordedAudio = [...audioPacketsBuffer];

		// Stop the audio listener
		if (audioSubscription) {
			audioSubscription.remove();
			audioSubscription = null;
		}

		// Reset state
		audioPacketsBuffer = [];
		isRecording$.set(false);

		console.log(
			`Stopped recording, captured ${recordedAudio.length} audio packets`,
		);

		return recordedAudio;
	};

	return {
		startRecording,
		stopRecording,
		isRecording$,
	};
})();
