import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import type { DeepgramResult } from "@/types/deepgram";
import {
	type DeepgramError,
	type ListenLiveClient,
	LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { deepgram } from "./deepgram";

export const deepgramLiveTranscriptionService = (() => {
	let liveTranscription: ListenLiveClient | null = null;
	let keepAliveInterval: NodeJS.Timeout | null = null;

	const startTranscription = () => {
		if (liveTranscription) {
			console.log("[Deepgram] Transcription already started");
			return;
		}

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
			},
		);

		liveTranscription.addListener(LiveTranscriptionEvents.Close, () => {
			console.log("[Deepgram] Connection closed");
			stopTranscription();
		});
	};

	const sendAudioPacket = (audioBuffer: Buffer) => {
		if (!liveTranscription) {
			console.log("[Deepgram] No active transcription session");
			return;
		}

		if (liveTranscription.getReadyState() === 1) {
			// OPEN
			liveTranscription.send(audioBuffer);
		} else if (liveTranscription.getReadyState() >= 2) {
			// CLOSING or CLOSED
			console.error(
				"[Deepgram] Trying to send audio packet but connection not open",
			);
		}
	};

	const stopTranscription = () => {
		if (keepAliveInterval) {
			clearInterval(keepAliveInterval);
			keepAliveInterval = null;
		}

		if (liveTranscription) {
			liveTranscription.requestClose();
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
