import { socketService } from "@/services/socket/socket";

export const logService = (() => {
	const originalConsole = {
		log: console.log,
		warn: console.warn,
		error: console.error,
	};

	const forwardingClients = new Set<string>(); // Set of socket IDs that requested log forwarding

	// Setup console overrides and error handlers
	setupConsoleOverride();
	setupErrorHandlers();

	// Register socket connection handler (only for disconnect cleanup)
	socketService.registerConnectionHandler((socket) => {
		// Handle start log forwarding request
		socket.on("startLogForwarding", (callback: (success: boolean) => void) => {
			forwardingClients.add(socket.id);
			console.log(`Client ${socket.id} started log forwarding`);
			callback(true);
		});

		// Handle stop log forwarding request
		socket.on("stopLogForwarding", (callback: (success: boolean) => void) => {
			forwardingClients.delete(socket.id);
			console.log(`Client ${socket.id} stopped log forwarding`);
			callback(true);
		});

		// Clean up when client disconnects
		socket.on("disconnect", () => {
			forwardingClients.delete(socket.id);
		});
	});

	function setupConsoleOverride(): void {
		// Override console.log
		console.log = (...args: unknown[]) => {
			// Call original console.log
			originalConsole.log(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog("log", args);
			}
		};

		// Override console.warn
		console.warn = (...args: unknown[]) => {
			// Call original console.warn
			originalConsole.warn(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog("warn", args);
			}
		};

		// Override console.error
		console.error = (...args: unknown[]) => {
			// Call original console.error
			originalConsole.error(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog("error", args);
			}
		};
	}

	function setupErrorHandlers(): void {
		// Handle uncaught exceptions
		process.on("uncaughtException", (error) => {
			// Use original console to prevent potential loops
			originalConsole.error(
				`Uncaught Exception: ${error.message}`,
				error.stack,
			);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog("error", [
					`Uncaught Exception: ${error.message}`,
					error.stack || "",
				]);
			}
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (reason) => {
			// Use original console to prevent potential loops
			originalConsole.error(`Unhandled Promise Rejection: ${reason}`);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog("error", [`Unhandled Promise Rejection: ${reason}`]);
			}
		});
	}

	function broadcastLog(type: "log" | "warn" | "error", args: unknown[]): void {
		try {
			// Convert arguments to string
			const message = args
				.map((arg) =>
					typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
				)
				.join(" ");

			// Get the socket.io instance
			const io = socketService.getIO();

			// Only send to clients that requested log forwarding
			for (const socketId of forwardingClients) {
				const socket = io.sockets.sockets.get(socketId);
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
			originalConsole.error("Error broadcasting log:", error);
		}
	}

	return {
		// Expose no methods publicly as everything is handled internally
	};
})();
