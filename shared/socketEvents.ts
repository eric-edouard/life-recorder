export type ServerLog = {
	type: "log" | "warn" | "error";
	message: string;
	timestamp: number;
};

export type SpeechDetectedUpdate = {
	phase: "0-speech-detected";
};

export type SpeechMisfireUpdate = {
	phase: "0.5-speech-misfire";
};

export type SpeechStoppedUpdate = {
	phase: "1-speech-stopped";
	id: string;
	startTime: number;
};

export type TranscribingUpdate = {
	phase: "3-transcribing";
	id: string;
};

export type NoSpeechDetectedUpdate = {
	phase: "3.5-no-speech-detected";
	id: string;
};

export type MatchingSpeakersUpdate = {
	phase: "4-matching-speakers";
	id: string;
	utterances: {
		utteranceId: string;
		startTime: number;
		transcript: string;
	}[];
};

export type DoneUpdate = {
	phase: "5-done";
	id: string;
	utterances: {
		utteranceId: string;
		speakerId: string | null;
	}[];
};

export type ProcessingSpeechUpdate =
	| SpeechDetectedUpdate
	| SpeechMisfireUpdate
	| SpeechStoppedUpdate
	| TranscribingUpdate
	| NoSpeechDetectedUpdate
	| MatchingSpeakersUpdate
	| DoneUpdate;

export interface ServerToClientEvents {
	processingSpeechUpdate: (update: ProcessingSpeechUpdate) => void;
}

export type ClientToServerEvents = {
	audioData: (data: { packets: number[][]; timestamp: number }) => void;
};
