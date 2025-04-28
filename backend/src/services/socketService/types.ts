import type { TypedSocket } from "@backend/src/types/socket-events";
import type { ClientToServerEvents } from "@shared/socketEvents";

export type SocketHanderCleanupFn = () => void;

export type SocketHandler<K extends keyof ClientToServerEvents> = (
	socket: TypedSocket,
	...args: Parameters<ClientToServerEvents[K]>
) => SocketHanderCleanupFn;

export type SocketHandlerMap = {
	[K in keyof ClientToServerEvents]: SocketHandler<K>;
};
