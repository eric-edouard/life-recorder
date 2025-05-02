import { socketService } from "@app/src/services/socketService";
import { observable } from "@legendapp/state";
import type { ProcessingSpeechUpdate } from "@shared/socketEvents";

export type LiveUtterance = {
	utteranceId: string;
	startTime: number;
	transcript: string;
	speakerStatus: "processing" | "recognized" | "unknown";
	speakerId: string | null;
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
						startTime: u.startTime,
						transcript: u.transcript,
						speakerStatus: "processing",
						speakerId: null,
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
