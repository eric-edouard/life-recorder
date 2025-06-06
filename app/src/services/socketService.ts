import { backendUrl } from "@app/src/constants/backendUrl";
import { authClient } from "@app/src/services/authClient";
import type { TypedSocket } from "@app/src/types/socket-events";
import { observable } from "@legendapp/state";
import { io } from "socket.io-client";

// Connection states for the socket
export enum SocketConnectionState {
	DISCONNECTED = "disconnected",
	CONNECTING = "connecting",
	CONNECTED = "connected",
}

export const socketService = (() => {
	// Observable for connection state
	const connectionState$ = observable<SocketConnectionState>(
		SocketConnectionState.DISCONNECTED,
	);

	let socket: TypedSocket | undefined;

	/**
	 * Initialize Socket.IO connection
	 */
	const initializeSocket = (): void => {
		connectionState$.set(SocketConnectionState.CONNECTING);

		socket = io(backendUrl, {
			transports: ["websocket", "polling"],
			auth: {
				cookies: authClient.getCookie(),
			},
		});

		socket.on("connect", () => {
			console.log(
				"[socketService] Connected to socket server using WebSockets",
			);
			connectionState$.set(SocketConnectionState.CONNECTED);

			// Log the active transport method
			if (socket) {
				const transport = socket.io.engine.transport.name;
				console.log(`[socketService] Active transport method: ${transport}`);
			}
		});

		socket.on("disconnect", () => {
			console.log("[socketService] Disconnected from socket server");
			connectionState$.set(SocketConnectionState.DISCONNECTED);
		});
	};

	// Initialize on creation
	initializeSocket();

	/**
	 * Get the socket instance
	 */
	const getSocket = (): TypedSocket => {
		if (!socket) {
			throw new Error("[socketService] No socket instance found");
		}
		return socket;
	};

	/**
	 * Get the current socket transport method
	 * @returns The name of the current transport or null if not connected
	 */
	const getCurrentTransport = (): string | null => {
		if (!socket?.connected) {
			return null;
		}
		return socket.io.engine.transport.name;
	};

	/**
	 * Manually reconnect to the socket server
	 * @returns Promise that resolves to true if reconnection was initiated
	 */
	const reconnectToServer = async (): Promise<boolean> => {
		if (socket?.connected) {
			console.log("Already connected to server");
			return false;
		}

		// Disconnect existing socket if any
		if (socket) {
			socket.disconnect();
		}

		// Reinitialize socket connection
		initializeSocket();
		return true;
	};

	/**
	 * Check if socket is connected
	 */
	const isConnected = (): boolean => {
		return socket?.connected ?? false;
	};

	return {
		get socket() {
			return socket;
		},
		connectionState$,
		getSocket,
		getCurrentTransport,
		reconnectToServer,
		isConnected,
	};
})();
