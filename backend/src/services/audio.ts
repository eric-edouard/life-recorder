/**
 * Audio processing service
 * This service handles processing audio data received from clients
 */

import { audioBufferManager } from "./audio-buffer";

/**
 * Process audio data
 * @param packets An array of audio data packets to process
 * @param socketId The socket ID of the client sending the data
 * @param timestamp The timestamp of the audio data
 * @returns true if the audio was successfully queued for processing
 */
export function processAudioData(
	packets: number[][],
	socketId: string,
	timestamp: number,
): boolean {
	try {
		// Process each packet individually
		for (const packetData of packets) {
			// Convert number array to ArrayBuffer
			const arrayBuffer = new Uint8Array(packetData).buffer;

			// Queue the audio data for processing
			void audioBufferManager.addPacket(socketId, arrayBuffer, timestamp);
		}

		console.log(
			`Queued ${packets.length} audio packets from client ${socketId}`,
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
