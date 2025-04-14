import type { Socket } from "socket.io";

type ServerLog = {
	type: "log" | "warn" | "error";
	message: string;
	timestamp: number;
};

export interface ServerToClientEvents {
	serverLog: (logData: ServerLog) => void;
}

export interface ClientToServerEvents {
	audioData: (
		data: { packets: number[][]; timestamp: number },
		callback: (success: boolean) => void,
	) => void;
	startLogForwarding: (callback: (success: boolean) => void) => void;
	stopLogForwarding: (callback: (success: boolean) => void) => void;
}

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export type TypedSocket = Socket<
	ServerToClientEvents,
	ClientToServerEvents,
	InterServerEvents,
	SocketData
>;
