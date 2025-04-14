import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import type { DeepgramResult } from "@/types/deepgram";
import {
	type DeepgramError,
	type ListenLiveClient,
	LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { deepgram } from "./deepgram";

class DeepgramLiveTranscriptionService {
	private liveTranscription: ListenLiveClient | null = null;
	private keepAliveInterval: NodeJS.Timeout | null = null;

	startTranscription() {
		if (this.liveTranscription) {
			console.log("[Deepgram] Transcription already started");
			return;
		}

		console.log("[Deepgram] Starting live transcription");
		this.liveTranscription = deepgram.listen.live({
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
		this.keepAliveInterval = setInterval(() => {
			if (this.liveTranscription) {
				console.log("[Deepgram] Sending keepalive");
				this.liveTranscription.keepAlive();
			}
		}, 10 * 1000);

		// Setup event listeners
		this.liveTranscription.addListener(LiveTranscriptionEvents.Open, () => {
			console.log("[Deepgram] Connection established");
		});

		this.liveTranscription.addListener(
			LiveTranscriptionEvents.Transcript,
			(data: DeepgramResult) => {
				console.log(
					"[Deepgram] Transcript received:",
					data.channel?.alternatives[0]?.transcript || "No transcript",
				);
			},
		);

		this.liveTranscription.addListener(
			LiveTranscriptionEvents.Error,
			(error: DeepgramError) => {
				console.error("[Deepgram] Error:", error);
			},
		);

		this.liveTranscription.addListener(LiveTranscriptionEvents.Close, () => {
			console.log("[Deepgram] Connection closed");
			this.cleanup();
		});
	}

	sendAudioPacket(audioBuffer: Buffer) {
		if (!this.liveTranscription) {
			console.log("[Deepgram] No active transcription session");
			return;
		}

		if (this.liveTranscription.getReadyState() === 1) {
			// OPEN
			this.liveTranscription.send(audioBuffer);
		} else if (this.liveTranscription.getReadyState() >= 2) {
			// CLOSING or CLOSED
			console.error(
				"[Deepgram] Trying to send audio packet but connection not open",
			);
		}
	}

	cleanup() {
		if (this.keepAliveInterval) {
			clearInterval(this.keepAliveInterval);
			this.keepAliveInterval = null;
		}

		if (this.liveTranscription) {
			this.liveTranscription.requestClose();
			this.liveTranscription.removeAllListeners();
			this.liveTranscription = null;
			console.log("[Deepgram] Transcription session cleaned up");
		}
	}
}

export const deepgramLiveTranscriptionService =
	new DeepgramLiveTranscriptionService();
