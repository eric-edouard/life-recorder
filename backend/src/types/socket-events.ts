import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@/shared/socketEvents";
import type { Server, Socket } from "socket.io";

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export type TypedSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

export type TypedServer = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

export type SocketMiddleware = (socket: TypedSocket, io: TypedServer) => void;
