/**
 * Audio processing service
 * This service handles processing audio data received from clients
 */

import { audioBufferManager } from "./audio-buffer";

/**
 * Process audio data
 * @param audioBuffer The audio data buffer to process
 * @param socketId The socket ID of the client sending the data
 * @param timestamp The timestamp of the audio data
 * @returns true if the audio was successfully queued for processing
 */
export function processAudioData(
	audioBuffer: ArrayBuffer,
	socketId: string,
	timestamp: number,
): boolean {
	try {
		// Queue the audio data for processing
		// The AudioBufferManager will accumulate packets until we have 3 seconds
		// Then it will process them, perform VAD, and upload to GCS
		void audioBufferManager.addPacket(socketId, audioBuffer, timestamp);

		console.log(
			`Queued audio data of size ${audioBuffer.byteLength} bytes from client ${socketId}`,
		);
		return true;
	} catch (error) {
		console.error("Error queueing audio data:", error);
		return false;
	}
}

/**
 * Handle client disconnect - process any remaining audio data
 * @param socketId The socket ID of the disconnected client
 */
export function handleClientDisconnect(socketId: string): void {
	try {
		// Process any remaining audio data for this client
		void audioBufferManager.flushClientBuffer(socketId);
	} catch (error) {
		console.error(`Error flushing audio buffer for client ${socketId}:`, error);
	}
}
