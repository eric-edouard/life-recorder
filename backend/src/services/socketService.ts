import type { Server as HttpServer } from "node:http";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	SocketMiddleware,
	TypedServer,
} from "@/types/socket-events";
import { Server as SocketIOServer } from "socket.io";

export const socketService = (() => {
	let io: TypedServer | null = null;

	// Registry of socket middlewares
	const middlewares: SocketMiddleware[] = [];

	/**
	 * Register a middleware to handle socket events
	 * @param middleware Function to handle socket connection
	 */
	const use = (middleware: SocketMiddleware): void => {
		middlewares.push(middleware);
	};

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

		io.on("connection", (socket) => {
			console.log("Client connected");

			// Apply all registered middlewares
			for (const middleware of middlewares) {
				// biome-ignore lint/style/noNonNullAssertion: Initialized in initialize()
				middleware(socket, io!);
			}

			// Basic disconnect logging
			socket.on("disconnect", () => {
				console.log("Client disconnected");
			});
		});
	};

	/**
	 * Get the Socket.IO server instance
	 */
	const getIO = (): TypedServer => {
		if (!io) {
			throw new Error(
				"Socket.IO server not initialized. Call initialize() first.",
			);
		}
		return io;
	};

	return {
		use,
		initialize,
		getIO,
	};
})();
