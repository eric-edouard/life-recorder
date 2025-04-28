import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/socketEvents";
import type { Session, User } from "better-auth/types";
import type { Server, Socket } from "socket.io";

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	auth: {
		session: Session;
		user: User;
	};
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
