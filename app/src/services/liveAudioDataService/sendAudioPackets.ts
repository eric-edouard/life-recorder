import type { TypedSocket } from "@app/src/types/socket-events";
import type { AudioPacket } from "@shared/sharedTypes";

export const sendAudioPackets = (
	socket: TypedSocket,
	packets: AudioPacket[],
) => {
	socket.emit("audioData", {
		packets,
		timestamp: Date.now(),
	});
};
