export interface ServerToClientEvents {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export interface ClientToServerEvents {
	audioData: (
		data: { audio: ArrayBuffer; timestamp: number },
		callback: (success: boolean) => void,
	) => void;
}

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}
