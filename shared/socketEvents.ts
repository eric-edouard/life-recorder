export type ServerLog = {
	type: "log" | "warn" | "error";
	message: string;
	timestamp: number;
};

export type ProcessingAudioPhase =
	| "1-converting-to-wav"
	| "2-transcribing"
	| "3-done";

export type LiveTranscript = {
	utteranceId: string;
	transcript: string;
	startTime: number;
};

export type LiveTranscriptSpeaker = {
	utteranceId: string;
	speakerId?: string;
	speakerName?: string;
	matched: boolean;
};

export interface ServerToClientEvents {
	speechStarted: () => void;
	speechStopped: () => void;
	processingAudioUpdate: (phase: ProcessingAudioPhase) => void;
	liveTranscript: (transcript: LiveTranscript) => void;
	liveTranscriptSpeakerIdentified: (
		transcriptSpeaker: LiveTranscriptSpeaker,
	) => void;
}

export type ClientToServerEvents = {
	audioData: (data: { packets: number[][]; timestamp: number }) => void;
};
