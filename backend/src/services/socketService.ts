import { socketHandleAudioData } from "@backend/src/services/socketHandleAudioData";
import { authenticateSocket } from "@backend/src/services/socketService/authenticateSocket";
import { getUtterances } from "@backend/src/services/utterancesService";
import type {
	InterServerEvents,
	SocketData,
	TypedServer,
	TypedSocket,
} from "@backend/src/types/socket-events";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/socketEvents";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

type SocketHandlerMap = {
	[K in keyof ClientToServerEvents]: (
		socket: TypedSocket,
		...args: Parameters<ClientToServerEvents[K]>
	) => void;
};

const socketHandlers: SocketHandlerMap = {
	ping: (_socket, nb) => {
		console.log("[socketService] Ping received", nb);
	},

	getUtterances: async (_socket, params, callback) => {
		console.log("[socketService] getUtterances received");

		const utterances = await getUtterances(params);
		callback(utterances, null);
	},

	audioData: (_socket, data, callback) => {
		console.log("[socketService] Audio data received");
		socketHandleAudioData(data, callback);
	},

	startLogForwarding: (_socket, callback) => {
		console.log("[socketService] Start log forwarding");
		callback(true);
	},

	stopLogForwarding: (_socket, callback) => {
		console.log("[socketService] Stop log forwarding");
		callback(true);
	},
};

export const socketService = (() => {
	let io: TypedServer | undefined;
	const sockets = new Map<string, TypedSocket>();

	const onSocketConnection = (socket: TypedSocket) => {
		sockets.set(socket.id, socket);

		console.log(
			"[socketService] Client connected:",
			socket.data.auth.user.email,
		);

		// Register all handlers dynamically
		for (const [event, handler] of Object.entries(socketHandlers) as [
			keyof typeof socketHandlers,
			(typeof socketHandlers)[keyof typeof socketHandlers],
		][]) {
			socket.on(event, (...args: any[]) => handler(socket, ...args));
		}

		socket.on("disconnect", () => {
			console.log(
				"[socketService] Client disconnected:",
				socket.data.auth.user.email,
			);
			sockets.delete(socket.id);
		});
	};

	const initialize = (server: HttpServer): void => {
		io = new SocketIOServer<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			},
			maxHttpBufferSize: 5 * 1024 * 1024, // 5MB max buffer size for audio data
		});

		io.use(authenticateSocket);

		io.on("connection", onSocketConnection);
	};

	return {
		get io() {
			return io;
		},
		get sockets() {
			return sockets;
		},
		initialize,
		getSocket(id: string): TypedSocket | undefined {
			return sockets.get(id);
		},
	};
})();
