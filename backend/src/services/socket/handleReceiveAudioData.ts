import { processAudioService } from "@/services/processAudioService/processAudioService";
import type { ClientToServerEvents } from "@/types/socket-events";

export const handleReceiveAudioData: ClientToServerEvents["audioData"] = (
	data,
	callback,
) => {
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
			void processAudioService.processAudioPacket(arrayBuffer, data.timestamp);
		}

		console.log(`Processed ${data.packets.length} audio packets`);
	} catch (error) {
		console.error("Error processing audio data:", error);
	}
};
