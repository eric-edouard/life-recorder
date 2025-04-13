/**
 * Audio processing service
 * This service handles processing audio data
 */

import { audioBufferManager } from "./audio-buffer";

/**
 * Process audio data
 * @param packets An array of audio data packets to process
 * @param timestamp The timestamp of the audio data
 * @returns true if the audio was successfully queued for processing
 */
export function processAudioData(
	packets: number[][],
	timestamp: number,
): boolean {
	try {
		// Process each packet individually
		for (const packetData of packets) {
			// Convert number array to ArrayBuffer
			const arrayBuffer = new Uint8Array(packetData).buffer;

			// Queue the audio data for processing
			void audioBufferManager.addPacket(arrayBuffer, timestamp);
		}

		console.log(`Queued ${packets.length} audio packets`);
		return true;
	} catch (error) {
		console.error("Error queueing audio data:", error);
		return false;
	}
}

/**
 * Handle application shutdown - process any remaining audio data
 */
export function handleShutdown(): void {
	try {
		// Process any remaining audio data
		void audioBufferManager.flush();
	} catch (error) {
		console.error("Error flushing audio buffer:", error);
	}
}
