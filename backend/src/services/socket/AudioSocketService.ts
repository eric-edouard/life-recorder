import { processAudioService } from "@/services/processAudioService/processAudioService";
import { socketService } from "@/services/socket/socket";

/**
 * Service for handling audio-related socket events
 */
export const audioSocketService = (() => {
	// Register the connection handler
	socketService.registerConnectionHandler((socket) => {
		// Handle audio data
		socket.on("audioData", (data, callback) => {
			// Immediately acknowledge receipt
			callback(true);

			try {
				console.log(
					`Received audio data. Timestamp: ${data.timestamp}, Packets: ${data.packets.length}`,
				);

				// Process each packet individually
				for (const packetData of data.packets) {
					// Convert number array to ArrayBuffer
					const arrayBuffer = new Uint8Array(packetData).buffer;

					// Send directly to audio processor
					void processAudioService.processAudioPacket(
						arrayBuffer,
						data.timestamp,
					);
				}

				console.log(`Processed ${data.packets.length} audio packets`);
			} catch (error) {
				console.error("Error processing audio data:", error);
			}
		});

		// Set up socket disconnect event to clean up audio processing
		socket.on("disconnect", () => {
			processAudioService.handleClientDisconnect();
		});
	});
})();
