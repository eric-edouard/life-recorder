import { socketService } from "@/src/services/socketService";
import { observable } from "@legendapp/state";

export const liveTranscriptionService = (() => {
	const isSpeechDetected$ = observable(false);
	const transcripts$ = observable<{ transcript: string; startTime: number }[]>(
		[],
	);

	socketService.socket?.on("speechStarted", () => isSpeechDetected$.set(true));
	socketService.socket?.on("speechStopped", () => isSpeechDetected$.set(false));

	socketService.socket?.on("transcriptReceived", (transcript, startTime) => {
		transcripts$.set((prev) => [...prev, { transcript, startTime }]);
	});

	return {
		isSpeechDetected$,
		transcripts$,
	};
})();
