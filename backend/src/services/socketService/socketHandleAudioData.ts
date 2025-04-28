import type { TypedSocket } from "@backend/src/types/socket-events";

/**
 * Socket middleware for handling audio-related socket events
 */
export const socketHandleAudioData = (
	socket: TypedSocket,
	data: { packets: number[][]; timestamp: number },
) => {
	// console.log(
	// 	`[socketHandleAudioData] Received audio data. Timestamp: ${data.timestamp}, Packets: ${data.packets.length}`,
	// );

	if (!socket.data.processAudioService) {
		throw new Error("Process audio service not found");
	}

	// Process each packet individually
	for (const packetData of data.packets) {
		void socket.data.processAudioService.processAudioPacket(
			// Convert number array to ArrayBuffer
			new Uint8Array(packetData).buffer,
			data.timestamp,
		);
	}

	console.log(
		`[socketHandleAudioData] Processed ${data.packets.length} audio packets`,
	);
};
