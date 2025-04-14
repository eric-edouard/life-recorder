import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	TypedServer,
	TypedSocket,
} from "@/types/socket-events";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

// Type for connection handlers that other services can register
type ConnectionHandler = (socket: TypedSocket) => void;

export const socketService = (() => {
	let io: TypedServer | null = null;

	// Registry of connection handlers from other services
	const connectionHandlers: ConnectionHandler[] = [];

	/**
	 * Register a handler to be called when a new socket connects
	 * @param handler Function to call with the socket on connection
	 */
	const registerConnectionHandler = (handler: ConnectionHandler): void => {
		connectionHandlers.push(handler);
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

			// Call all registered connection handlers
			for (const handler of connectionHandlers) {
				handler(socket);
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
		registerConnectionHandler,
		initialize,
		getIO,
	};
})();
