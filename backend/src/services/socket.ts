import type { Server as HttpServer } from "node:http";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket-events";
import { Server as SocketIOServer } from "socket.io";
import { audioProcessor } from "./audio";

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

					// Process each packet individually
					for (const packetData of data.packets) {
						// Convert number array to ArrayBuffer
						const arrayBuffer = new Uint8Array(packetData).buffer;

						// Send directly to audio processor
						void audioProcessor.processAudioPacket(arrayBuffer, data.timestamp);
					}

					console.log(`Processed ${data.packets.length} audio packets`);
				} catch (error) {
					console.error("Error processing audio data:", error);
				}
			});

			// Handle disconnection
			socket.on("disconnect", () => {
				console.log("Client disconnected");

				// Clean up audio processing
				void audioProcessor.cleanup();
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
