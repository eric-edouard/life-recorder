import { sendAudioPackets } from "@app/src/services/liveAudioDataService/sendAudioPackets";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
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
			sendAudioPackets(socketService.getSocket(), packetsToSend);
		} catch (e) {
			buffer = [...packetsToSend, ...buffer];
			notifyError("packetBufferService", "Error sending packets", e);
		} finally {
			isSending = false;
		}
	};

	const start = () => {
		flush();
		if (!interval) {
			interval = setInterval(flush, sendInterval);
		}
	};

	const stop = async () => {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		flush();
	};

	liveTranscriptionService.isSpeechDetected$.onChange(
		({ value: isSpeechDetected }) => {
			if (isSpeechDetected) {
				start();
			} else {
				stop();
			}
		},
	);

	const handlePacket = (packet: AudioPacket) => {
		buffer.push(packet);
		if (!interval) {
			start();
		}
	};

	return {
		handlePacket,
	};
})();
