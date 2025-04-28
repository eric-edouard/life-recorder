import { socketService } from "@app/src/services/socketService";
import { filterUniqueById } from "@app/src/utils/filterUniqueId";
import { observable } from "@legendapp/state";
import type {
	LiveTranscript,
	ProcessingAudioPhase,
} from "@shared/socketEvents";

export type SpeakerLoading = {
	speakerId?: null;
	speakerName?: null;
	identified: false;
	isLoading: true;
};

export type SpeakerIdentified = {
	speakerId: string;
	speakerName: string;
	identified: true;
	isLoading: false;
};

export type SpeakerNotIdentified = {
	speakerId?: null;
	speakerName?: null;
	identified: false;
	isLoading: false;
};

export type Speaker = SpeakerLoading | SpeakerIdentified | SpeakerNotIdentified;

export type LiveTranscriptWithSpeaker = LiveTranscript & {
	speaker: Speaker;
};

const speakerLoading: SpeakerLoading = {
	isLoading: true,
	speakerId: null,
	speakerName: null,
	identified: false,
};

export const liveTranscriptionService = (() => {
	const isSpeechDetected$ = observable(false);
	const processingAudioPhase$ = observable<ProcessingAudioPhase>("3-done");
	const transcripts$ = observable<LiveTranscriptWithSpeaker[]>([]);

	socketService.socket?.on("speechStarted", () => isSpeechDetected$.set(true));
	socketService.socket?.on("speechStopped", () => isSpeechDetected$.set(false));

	socketService.socket?.on("processingAudioUpdate", (phase) =>
		processingAudioPhase$.set(phase),
	);

	socketService.socket?.on("liveTranscript", (transcript) => {
		return transcripts$.set((prev) =>
			filterUniqueById(
				[
					...prev,
					{
						...transcript,
						speaker: speakerLoading,
					},
				],
				"utteranceId",
			),
		);
	});

	socketService.socket?.on("liveTranscriptSpeakerIdentified", (speaker) => {
		const foundIndex = transcripts$
			.peek()
			.findIndex((t) => t.utteranceId === speaker.utteranceId);
		if (foundIndex === -1) {
			return;
		}

		console.log(
			"[liveTranscriptionService] liveTranscriptSpeakerIdentified",
			speaker,
		);

		transcripts$[foundIndex].speaker.set(
			speaker.matched
				? {
						speakerId: speaker.speakerId as string,
						speakerName: speaker.speakerName as string,
						identified: speaker.matched,
						isLoading: false,
					}
				: {
						speakerId: null,
						speakerName: null,
						identified: false,
						isLoading: false,
					},
		);
	});

	return {
		isSpeechDetected$,
		processingAudioPhase$,
		transcripts$,
	};
})();
