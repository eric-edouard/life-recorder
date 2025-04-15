export type ServerLog = {
	type: "log" | "warn" | "error";
	message: string;
	timestamp: number;
};

export interface ServerToClientEvents {
	serverLog: (logData: ServerLog) => void;
	speechStarted: () => void;
	speechStopped: () => void;
	transcriptionInProgress: () => void;
	transcriptReceived: (transcript: string, startTime: number) => void;
}

export interface ClientToServerEvents {
	audioData: (
		data: { packets: number[][]; timestamp: number },
		callback: (success: boolean) => void,
	) => void;
	startLogForwarding: (callback: (success: boolean) => void) => void;
	stopLogForwarding: (callback: (success: boolean) => void) => void;
}
