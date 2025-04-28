import type { Server as HttpServer } from "node:http";
import { createProcessAudioService } from "@backend/src/services/processAudioService/processAudioService";
import { authenticateSocket } from "@backend/src/services/socketService/authenticateSocket";
import { socketHandleAudioData } from "@backend/src/services/socketService/socketHandleAudioData";
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
import { Server as SocketIOServer } from "socket.io";

export const socketService = (() => {
	let io: TypedServer | undefined;
	const sockets = new Map<string, TypedSocket>();

	const onSocketConnection = (socket: TypedSocket) => {
		sockets.set(socket.id, socket);

		console.log(
			"[socketService] Client connected:",
			socket.data.auth.user.email,
		);

		socket.data.processAudioService = createProcessAudioService(socket);

		socket.on("audioData", (data) => {
			socketHandleAudioData(socket, data);
		});

		socket.on("disconnect", async () => {
			console.log(
				"[socketService] Client disconnected:",
				socket.data.auth.user.email,
			);
			await socket.data.processAudioService?.handleClientDisconnect();
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
