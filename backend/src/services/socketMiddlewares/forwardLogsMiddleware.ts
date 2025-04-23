import type { SocketMiddleware } from "@backend/types/socket-events";

/**
 * Creates and returns a socket middleware for log handling
 */
export const forwardLogsMiddleware: SocketMiddleware = (() => {
	// Private state confined to this closure
	const forwardingClients = new Set<string>();
	const originalConsole = {
		log: console.log,
		warn: console.warn,
		error: console.error,
	};

	/**
	 * Broadcasts a log message to connected clients
	 */
	function broadcastLog(
		io: any,
		type: "log" | "warn" | "error",
		args: unknown[],
	): void {
		try {
			// Convert arguments to string
			const message = args
				.map((arg) =>
					typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
				)
				.join(" ");

			// Check if we have an io instance
			if (!io) {
				originalConsole.error(
					"Socket.IO not initialized yet, can't broadcast logs",
				);
				return;
			}

			// Loop through connected clients that have requested log forwarding
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

	/**
	 * Setup console method overrides
	 */
	function setupConsoleOverride(io: any): void {
		// Override console.log
		console.log = (...args: unknown[]) => {
			// Call original console.log
			originalConsole.log(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog(io, "log", args);
			}
		};

		// Override console.warn
		console.warn = (...args: unknown[]) => {
			// Call original console.warn
			originalConsole.warn(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog(io, "warn", args);
			}
		};

		// Override console.error
		console.error = (...args: unknown[]) => {
			// Call original console.error
			originalConsole.error(...args);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog(io, "error", args);
			}
		};
	}

	/**
	 * Setup global error handlers
	 */
	function setupErrorHandlers(io: any): void {
		// Handle uncaught exceptions
		process.on("uncaughtException", (error) => {
			// Use original console to prevent potential loops
			originalConsole.error(
				`Uncaught Exception: ${error.message}`,
				error.stack,
			);

			// Forward to clients if enabled
			if (forwardingClients.size > 0) {
				broadcastLog(io, "error", [
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
				broadcastLog(io, "error", [`Unhandled Promise Rejection: ${reason}`]);
			}
		});
	}

	// Initialize the middleware function
	return (socket, io) => {
		// Setup console overrides and error handlers on first socket connection
		if (forwardingClients.size === 0) {
			setupConsoleOverride(io);
			setupErrorHandlers(io);
		}

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
	};
})();
