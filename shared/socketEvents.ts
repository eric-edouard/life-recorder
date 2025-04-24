export type ServerLog = {
	type: "log" | "warn" | "error";
	message: string;
	timestamp: number;
};

export type ProcessingAudioPhase =
	| "1-converting-to-wav"
	| "2-transcribing"
	| "3-done";
export interface ServerToClientEvents {
	serverLog: (logData: ServerLog) => void;
	speechStarted: () => void;
	speechStopped: () => void;
	processingAudioUpdate: (phase: ProcessingAudioPhase) => void;
	transcriptReceived: (transcript: string, startTime: number) => void;
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
}
