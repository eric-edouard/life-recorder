import { liveAudioDataService } from "@app/src/services/liveAudioDataService";
import { socketService } from "@app/src/services/socketService";
import { observable, observe } from "@legendapp/state";
import type { ProcessingSpeechUpdate } from "@shared/socketEvents";

export type LiveUtterance = {
	utteranceId: string;
	speechStart: number;
	speechEnd: number;
	transcript: string;
	speakerStatus: "processing" | "recognized" | "unknown";
	speakerId: string | null;
	voiceProfileId: string | null;
};

export type SpeechProcessingStatus =
	| "none"
	| "processing-audio"
	| "transcribing"
	| "matching"
	| "done";

export const liveTranscriptionService = (() => {
	const isSpeechDetected$ = observable(false);
	const speechProcessingStatus$ = observable<SpeechProcessingStatus>("none");
	const liveUtterances$ = observable<LiveUtterance[]>([]);

	observe(isSpeechDetected$, ({ value }) => {
		liveAudioDataService.setAudioSendInterval(value ? 60 : 500);
	});

	socketService.socket?.on(
		"processingSpeechUpdate",
		(update: ProcessingSpeechUpdate) => {
			switch (update.phase) {
				case "0-speech-detected":
					isSpeechDetected$.set(true);
					speechProcessingStatus$.set("none");
					break;
				case "0.5-speech-misfire":
					isSpeechDetected$.set(false);
					speechProcessingStatus$.set("none");
					break;
				case "1-speech-stopped":
					isSpeechDetected$.set(false);
					speechProcessingStatus$.set("processing-audio");
					break;
				case "3-transcribing":
					speechProcessingStatus$.set("transcribing");
					break;
				case "3.5-no-speech-detected":
					isSpeechDetected$.set(false);
					speechProcessingStatus$.set("none");
					break;
				case "4-matching-speakers":
					speechProcessingStatus$.set("matching");

					// biome-ignore lint/correctness/noSwitchDeclarations: <explanation>
					const newUtterances: LiveUtterance[] = update.utterances.map((u) => ({
						utteranceId: u.utteranceId,
						speechStart: u.speechStart,
						speechEnd: u.speechEnd,
						transcript: u.transcript,
						speakerStatus: "processing",
						speakerId: null,
						voiceProfileId: null,
					}));

					liveUtterances$.set((prev) => [...prev, ...newUtterances]);
					break;
				case "5-done":
					speechProcessingStatus$.set("done");
					liveUtterances$.set((prev) =>
						prev.map((utterance) => {
							const matchingUtterance = update.utterances.find(
								(u) => u.utteranceId === utterance.utteranceId,
							);
							return matchingUtterance
								? {
										...utterance,
										speakerStatus: "recognized",
										speakerId: matchingUtterance.speakerId,
										voiceProfileId: matchingUtterance.voiceProfileId,
									}
								: { ...utterance, speakerStatus: "unknown" };
						}),
					);
					break;
			}
		},
	);

	return {
		isSpeechDetected$,
		speechProcessingStatus$,
		liveUtterances$,
	};
})();
