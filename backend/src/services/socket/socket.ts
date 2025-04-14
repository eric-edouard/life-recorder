import { handleReceiveAudioData } from "@/services/socket/handleReceiveAudioData";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket-events";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { LogService } from "../logService";
import { processAudioService } from "../processAudioService/processAudioService";

export class SocketService {
	private io: SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;
	private logService: LogService;

	constructor(server: HttpServer) {
		this.io = new SocketIOServer<
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

		// Initialize log service
		this.logService = new LogService(this.io);

		this.io.on("connection", (socket) => {
			console.log("Client connected");

			// Set up log forwarding events for this socket
			this.logService.setupSocketEvents(socket);

			// Handle audio data
			socket.on("audioData", handleReceiveAudioData);

			// Handle disconnection
			socket.on("disconnect", () => {
				console.log("Client disconnected");
				// Clean up audio processing
				void processAudioService.handleClientDisconnect();
			});
		});
	}
}
