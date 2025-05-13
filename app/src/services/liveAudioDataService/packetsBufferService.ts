import { socketService } from "@app/src/services/socketService";
import { notifyError } from "@app/src/utils/notifyError";
import type { AudioPacket } from "@shared/sharedTypes";

export const packetBufferService = (() => {
	let buffer: AudioPacket[] = [];
	let isSending = false;
	let interval: NodeJS.Timeout | null = null;
	const sendInterval = 500;

	const flush = async () => {
		if (buffer.length === 0 || isSending) return;
		isSending = true;
		const packetsToSend = [...buffer];
		buffer = [];

		try {
			socketService.getSocket().emit("audioData", {
				packets: packetsToSend,
				timestamp: Date.now(),
			});
		} catch (e) {
			buffer = [...packetsToSend, ...buffer];
			notifyError("packetBufferService", "Error sending packets", e);
		} finally {
			isSending = false;
		}
	};

	return {
		add: (packet: AudioPacket) => buffer.push(packet),
		start: () => {
			if (!interval) {
				interval = setInterval(flush, sendInterval);
			}
		},
		stop: async () => {
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			await flush();
		},
	};
})();
