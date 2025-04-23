import { socketService } from "@app/services/socketService";
import { observable } from "@legendapp/state";
import type { ProcessingAudioPhase } from "@shared/socketEvents";

export const liveTranscriptionService = (() => {
	const isSpeechDetected$ = observable(false);
	const processingAudioPhase$ = observable<ProcessingAudioPhase>("3-done");
	const transcripts$ = observable<{ transcript: string; startTime: number }[]>(
		[],
	);

	socketService.socket?.on("speechStarted", () => isSpeechDetected$.set(true));
	socketService.socket?.on("speechStopped", () => isSpeechDetected$.set(false));

	socketService.socket?.on("processingAudioUpdate", (phase) =>
		processingAudioPhase$.set(phase),
	);

	socketService.socket?.on("transcriptReceived", (transcript, startTime) => {
		transcripts$.set((prev) => [...prev, { transcript, startTime }]);
	});

	return {
		isSpeechDetected$,
		processingAudioPhase$,
		transcripts$,
	};
})();
