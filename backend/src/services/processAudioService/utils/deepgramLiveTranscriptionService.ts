import { CHANNELS, SAMPLE_RATE } from "@backend/constants/audioConstants";
import type { DeepgramResult } from "@backend/types/deepgram";
import {
	type DeepgramError,
	type ListenLiveClient,
	LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { deepgram } from "../../external/deepgram";

export const deepgramLiveTranscriptionService = (() => {
	let liveTranscription: ListenLiveClient | null = null;
	let keepAliveInterval: NodeJS.Timeout | null = null;
	const preConnectionBuffer: Buffer[] = [];
	let isConnecting = false; // To know if we should buffer or warn

	const startTranscription = () => {
		if (liveTranscription || isConnecting) {
			console.log("[Deepgram] Transcription already started or starting");
			return;
		}

		isConnecting = true;
		preConnectionBuffer.length = 0; // Clear any previous buffer
		console.log("[Deepgram] Starting live transcription");
		liveTranscription = deepgram.listen.live({
			model: "nova-3",
			encoding: "linear16",
			sample_rate: SAMPLE_RATE,
			channels: CHANNELS,
			language: "multi",
			diarize: true,
			smart_format: true,
			filler_words: true,
		});

		// Setup keepalive
		keepAliveInterval = setInterval(() => {
			if (liveTranscription) {
				console.log("[Deepgram] Sending keepalive");
				liveTranscription.keepAlive();
			}
		}, 10 * 1000);

		// Setup event listeners
		liveTranscription.addListener(LiveTranscriptionEvents.Open, () => {
			console.log("[Deepgram] Connection established");
			isConnecting = false; // Connection is now open

			// Send buffered packets first
			console.log(
				`[Deepgram] Sending ${preConnectionBuffer.length} buffered packets`,
			);
			for (const packet of preConnectionBuffer) {
				if (liveTranscription?.getReadyState() === 1) {
					liveTranscription.send(
						packet.buffer.slice(
							packet.byteOffset,
							packet.byteOffset + packet.byteLength,
						),
					);
				}
			}
			preConnectionBuffer.length = 0; // Clear buffer
		});

		liveTranscription.addListener(
			LiveTranscriptionEvents.Transcript,
			(data: DeepgramResult) => {
				console.log(
					"[Deepgram] Transcript received:",
					data.channel?.alternatives[0]?.transcript || "No transcript",
				);
			},
		);

		liveTranscription.addListener(
			LiveTranscriptionEvents.Error,
			(error: DeepgramError) => {
				console.error("[Deepgram] Error:", error);
				isConnecting = false;
				preConnectionBuffer.length = 0; // Clear buffer on error
				stopTranscription(); // Clean up on error
			},
		);

		liveTranscription.addListener(LiveTranscriptionEvents.Close, () => {
			console.log("[Deepgram] Connection closed");
			isConnecting = false;
			preConnectionBuffer.length = 0; // Clear buffer on close
			stopTranscription(); // Ensure full cleanup
		});
	};

	const sendAudioPacket = (audioBuffer: Buffer) => {
		if (liveTranscription && liveTranscription.getReadyState() === 1) {
			// Connection is open, send directly
			liveTranscription.send(
				audioBuffer.buffer.slice(
					audioBuffer.byteOffset,
					audioBuffer.byteOffset + audioBuffer.byteLength,
				),
			);
		} else if (isConnecting) {
			// Connection is in progress (started but not open yet), buffer the packet
			preConnectionBuffer.push(audioBuffer);
		} else {
			// No active or pending connection
			console.warn(
				"[Deepgram] No active transcription session, packet not sent or buffered",
			);
		}
	};

	const stopTranscription = () => {
		isConnecting = false;
		preConnectionBuffer.length = 0; // Clear buffer

		if (keepAliveInterval) {
			clearInterval(keepAliveInterval);
			keepAliveInterval = null;
		}

		if (liveTranscription) {
			if (liveTranscription.getReadyState() < 2) {
				// If not CLOSING or CLOSED
				liveTranscription.requestClose();
			}
			liveTranscription.removeAllListeners();
			liveTranscription = null;
			console.log("[Deepgram] Transcription session cleaned up");
		}
	};

	return {
		startTranscription,
		sendAudioPacket,
		stopTranscription,
	};
})();
