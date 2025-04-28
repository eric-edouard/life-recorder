import type { VoiceProfileType } from "@shared/sharedTypes";

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
	serverLog: (logData: ServerLog) => void;
	speechStarted: () => void;
	speechStopped: () => void;
	processingAudioUpdate: (phase: ProcessingAudioPhase) => void;
	liveTranscript: (transcript: LiveTranscript) => void;
	liveTranscriptSpeakerIdentified: (
		transcriptSpeaker: LiveTranscriptSpeaker,
	) => void;
}

export type GetUtterancesParams = {
	from: number;
	to: number;
};

export type GetUtterancesResponse = {
	utterances: {
		id: string;
		transcript: string;
		createdAt: number;
		nonIdentifiedSpeaker: number | null;
		speaker: string | null;
		words: {
			word: string;
			start: number;
			end: number;
		}[];
	}[];
};

export interface ClientToServerEvents {
	audioData: (
		data: { packets: number[][]; timestamp: number },
		callback: (success: boolean) => void,
	) => void;
	startLogForwarding: (callback: (success: boolean) => void) => void;
	stopLogForwarding: (callback: (success: boolean) => void) => void;
	ping: (nb: number) => void;
	getUtterances: (
		params: GetUtterancesParams,
		callback: (response: GetUtterancesResponse, error: string | null) => void,
	) => void;
	createVoiceProfile: (
		type: VoiceProfileType,
		callback: (
			reponse:
				| { success: true; id: string; fileId: string }
				| { success: false; error: string },
		) => void,
	) => void;
}
