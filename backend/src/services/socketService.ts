import type { Server as HttpServer } from "node:http";
import { forwardLogsMiddleware } from "@backend/src/services/socketMiddlewares/forwardLogsMiddleware";
import { handleAudioMiddleware } from "@backend/src/services/socketMiddlewares/handleAudioMiddleware";
import { getUtterances } from "@backend/src/services/utterancesService";
import type {
	InterServerEvents,
	SocketData,
	SocketMiddleware,
	TypedServer,
	TypedSocket,
} from "@backend/src/types/socket-events";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/socketEvents";
import { Server as SocketIOServer } from "socket.io";

// The middlewares that will be applied to all socket connections
const middlewares: SocketMiddleware[] = [
	handleAudioMiddleware,
	forwardLogsMiddleware,
];

export const socketService = (() => {
	let io: TypedServer | undefined;
	let socket: TypedSocket | undefined;

	/**
	 * Initialize the Socket.IO server
	 * @param server HTTP server instance
	 */
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

		io.on("connection", (_socket) => {
			console.log("Client connected");
			socket = _socket;
			// Apply all registered middlewares
			for (const middleware of middlewares) {
				// biome-ignore lint/style/noNonNullAssertion: Initialized in initialize()
				middleware(_socket, io!);
			}

			_socket.on("ping", (nb: number) => {
				console.log("Ping received", nb);
			});

			// Basic disconnect logging
			_socket.on("disconnect", () => {
				console.log("Client disconnected");
			});

			_socket.on("getUtterances", async (params, callback) => {
				const utterances = await getUtterances(params);
				callback(utterances, null);
			});
		});
	};

	return {
		get socket() {
			return socket;
		},
		get io() {
			return io;
		},
		initialize,
	};
})();
