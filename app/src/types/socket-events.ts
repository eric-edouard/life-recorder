import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@/src/shared/socketEvents";
import type { Socket } from "socket.io-client";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
