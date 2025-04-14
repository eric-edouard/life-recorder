import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket-events";
import type { Socket, Server as SocketIOServer } from "socket.io";

export class LogService {
	private io: SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;
	private originalConsole: {
		log: typeof console.log;
		warn: typeof console.warn;
		error: typeof console.error;
	};
	private forwardingEnabled: boolean;
	private forwardingClients: Set<string>; // Set of socket IDs that requested log forwarding

	constructor(
		io: SocketIOServer<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>,
	) {
		this.io = io;
		this.forwardingEnabled = false;
		this.forwardingClients = new Set<string>();

		// Save original console methods
		this.originalConsole = {
			log: console.log,
			warn: console.warn,
			error: console.error,
		};

		this.setupConsoleOverride();
		this.setupErrorHandlers();
	}

	public setupSocketEvents(
		socket: Socket<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>,
	): void {
		// Handle start log forwarding request
		socket.on("startLogForwarding", (callback: (success: boolean) => void) => {
			this.forwardingClients.add(socket.id);
			console.log(`Client ${socket.id} started log forwarding`);
			callback(true);
		});

		// Handle stop log forwarding request
		socket.on("stopLogForwarding", (callback: (success: boolean) => void) => {
			this.forwardingClients.delete(socket.id);
			console.log(`Client ${socket.id} stopped log forwarding`);
			callback(true);
		});

		// Clean up when client disconnects
		socket.on("disconnect", () => {
			this.forwardingClients.delete(socket.id);
		});
	}

	private setupConsoleOverride(): void {
		// Override console.log
		console.log = (...args: unknown[]) => {
			// Call original console.log
			this.originalConsole.log(...args);

			// Forward to clients if enabled
			if (this.forwardingClients.size > 0) {
				this.broadcastLog("log", args);
			}
		};

		// Override console.warn
		console.warn = (...args: unknown[]) => {
			// Call original console.warn
			this.originalConsole.warn(...args);

			// Forward to clients if enabled
			if (this.forwardingClients.size > 0) {
				this.broadcastLog("warn", args);
			}
		};

		// Override console.error
		console.error = (...args: unknown[]) => {
			// Call original console.error
			this.originalConsole.error(...args);

			// Forward to clients if enabled
			if (this.forwardingClients.size > 0) {
				this.broadcastLog("error", args);
			}
		};
	}

	private setupErrorHandlers(): void {
		// Handle uncaught exceptions
		process.on("uncaughtException", (error) => {
			// Use original console to prevent potential loops
			this.originalConsole.error(
				`Uncaught Exception: ${error.message}`,
				error.stack,
			);

			// Forward to clients if enabled
			if (this.forwardingClients.size > 0) {
				this.broadcastLog("error", [
					`Uncaught Exception: ${error.message}`,
					error.stack || "",
				]);
			}
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (reason) => {
			// Use original console to prevent potential loops
			this.originalConsole.error(`Unhandled Promise Rejection: ${reason}`);

			// Forward to clients if enabled
			if (this.forwardingClients.size > 0) {
				this.broadcastLog("error", [`Unhandled Promise Rejection: ${reason}`]);
			}
		});
	}

	private broadcastLog(type: "log" | "warn" | "error", args: unknown[]): void {
		try {
			// Convert arguments to string
			const message = args
				.map((arg) =>
					typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
				)
				.join(" ");

			// Only send to clients that requested log forwarding
			for (const socketId of this.forwardingClients) {
				const socket = this.io.sockets.sockets.get(socketId);
				if (socket) {
					socket.emit("serverLog", {
						type,
						message,
						timestamp: Date.now(),
					});
				}
			}
		} catch (error) {
			// Use original console to prevent infinite loop
			this.originalConsole.error("Error broadcasting log:", error);
		}
	}
}
