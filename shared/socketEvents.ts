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

export type SpeechEndUpdate = {
	phase: "1-speech-end";
	fileId: string;
	startTime: number;
};

export type NoSpeechDetectedUpdate = {
	phase: "1.5-no-speech-detected";
	fileId: string;
};

export type MatchingSpeakersUpdate = {
	phase: "2-matching-speakers";
	fileId: string;
	utterances: {
		utteranceId: string;
		fileId: string;
		startTime: number;
		transcript: string;
	}[];
};

export type DoneUpdate = {
	phase: "3-done";
	fileId: string;
	utterances: {
		utteranceId: string;
		speakerId: string | null;
		voiceProfileId: string;
	}[];
};

export type ProcessingSpeechUpdate =
	| SpeechDetectedUpdate
	| SpeechMisfireUpdate
	| SpeechEndUpdate
	| NoSpeechDetectedUpdate
	| MatchingSpeakersUpdate
	| DoneUpdate;

export interface ServerToClientEvents {
	processingSpeechUpdate: (update: ProcessingSpeechUpdate) => void;
}

export type ClientToServerEvents = {
	audioData: (data: { packets: number[][]; timestamp: number }) => void;
};
