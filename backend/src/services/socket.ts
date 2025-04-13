import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket-events";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { handleDisconnect, processAudioData } from "./audio";

export class SocketService {
	private io: SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;

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

		this.setupSocketEvents();
	}

	private setupSocketEvents(): void {
		this.io.on("connection", (socket) => {
			console.log("Client connected");

			// Handle audio data
			socket.on("audioData", (data, callback) => {
				// Immediately acknowledge receipt
				callback(true);

				try {
					console.log(
						`Received audio data. Timestamp: ${data.timestamp}, Packets: ${data.packets.length}`,
					);

					// Process audio data after acknowledgment
					processAudioData(data.packets, data.timestamp);
				} catch (error) {
					console.error("Error processing audio data:", error);
					// Processing errors don't affect acknowledgment
				}
			});

			// Handle disconnection
			socket.on("disconnect", () => {
				console.log("Client disconnected");

				// Process any remaining audio data
				handleDisconnect();
			});
		});
	}

	// Get the socket.io instance
	public getIO(): SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	> {
		return this.io;
	}
}
