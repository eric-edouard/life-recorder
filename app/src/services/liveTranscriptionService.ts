import { liveAudioDataService } from "@app/src/services/liveAudioDataService";
import { socketService } from "@app/src/services/socketService";
import { observable, observe } from "@legendapp/state";
import type { ProcessingSpeechUpdate } from "@shared/socketEvents";

type LiveBaseUtterance = {
	utteranceId: string;
	speechStart: number;
	transcript: string;
};

type LiveProcessingUtterance = LiveBaseUtterance & {
	speakerStatus: "processing";
	speakerId: null;
	voiceProfileId: null;
};

type LiveRecognizedUtterance = LiveBaseUtterance & {
	speakerStatus: "recognized";
	speakerId: string;
	voiceProfileId: string;
};

type LiveUnrecognizedUtterance = LiveBaseUtterance & {
	speakerStatus: "unknown";
	speakerId: null;
	voiceProfileId: string;
};

export type LiveUtterance =
	| LiveProcessingUtterance
	| LiveRecognizedUtterance
	| LiveUnrecognizedUtterance;

export type SpeechProcessingStatus =
	| "none"
	| "transcribing"
	| "matching"
	| "done";

export const liveTranscriptionService = (() => {
	const isSpeechDetected$ = observable(false);
	const speechProcessingStatus$ = observable<SpeechProcessingStatus>("none");
	const liveUtterances$ = observable<LiveUtterance[]>([]);

	observe(isSpeechDetected$, ({ value: isSpeechDetected }) => {
		liveAudioDataService.setBufferedEmitting(!isSpeechDetected);
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
				case "1-speech-end":
					isSpeechDetected$.set(false);
					speechProcessingStatus$.set("transcribing");
					break;
				case "1.5-no-speech-detected":
					isSpeechDetected$.set(false);
					speechProcessingStatus$.set("none");
					break;
				case "2-matching-speakers":
					speechProcessingStatus$.set("matching");

					// biome-ignore lint/correctness/noSwitchDeclarations: <explanation>
					const newUtterances: LiveUtterance[] = update.utterances.map((u) => ({
						utteranceId: u.utteranceId,
						speechStart: u.startTime,
						transcript: u.transcript,
						speakerStatus: "processing",
						speakerId: null,
						voiceProfileId: null,
					}));

					liveUtterances$.set((prev) => [...prev, ...newUtterances]);
					break;
				case "3-done":
					speechProcessingStatus$.set("done");
					console.log("3-done", update.utterances);
					liveUtterances$.set((prev: LiveUtterance[]) =>
						prev.map((liveUtterance: LiveUtterance) => {
							const matchingFinalUtterance = update.utterances.find(
								(u) => u.utteranceId === liveUtterance.utteranceId,
							);

							if (matchingFinalUtterance) {
								// Base properties are taken from the existing liveUtterance,
								// as the update likely only contains speaker identification results.
								const baseProperties = {
									utteranceId: liveUtterance.utteranceId,
									speechStart: liveUtterance.speechStart,
									transcript: liveUtterance.transcript,
								};

								if (matchingFinalUtterance.speakerId) {
									// Speaker is recognized
									return {
										...baseProperties,
										speakerStatus: "recognized" as const,
										speakerId: matchingFinalUtterance.speakerId,
										voiceProfileId: matchingFinalUtterance.voiceProfileId, // Assumed to be string
									} as LiveRecognizedUtterance;
								}
								// Speaker is not recognized (speakerId is null)
								return {
									...baseProperties,
									speakerStatus: "unknown" as const,
									speakerId: null,
									voiceProfileId: matchingFinalUtterance.voiceProfileId, // Assumed to be string
								} as LiveUnrecognizedUtterance;
							}
							// If no matching utterance is found in the update, return the existing one.
							return liveUtterance;
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
