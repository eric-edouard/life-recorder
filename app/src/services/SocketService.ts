import type { TypedSocket } from "@/src/types/socket-events";
import { observable } from "@legendapp/state";
import { io } from "socket.io-client";

// Connection states for the socket
export enum SocketConnectionState {
	DISCONNECTED = "disconnected",
	CONNECTING = "connecting",
	CONNECTED = "connected",
}

export class SocketService {
	// Observable for connection state
	public connectionState$ = observable<SocketConnectionState>(
		SocketConnectionState.DISCONNECTED,
	);

	private socketEndpoint = "life-recorder-production.up.railway.app";
	private socket: TypedSocket | null = null;

	constructor() {
		this.initializeSocket();
	}

	/**
	 * Get the socket instance
	 */
	getSocket(): TypedSocket {
		if (!this.socket) {
			this.initializeSocket();
		}

		// Still null? Something went wrong, but try to recover
		if (!this.socket) {
			throw new Error("Failed to initialize socket");
		}

		return this.socket;
	}

	/**
	 * Initialize Socket.IO connection
	 */
	private initializeSocket = (): void => {
		this.connectionState$.set(SocketConnectionState.CONNECTING);

		this.socket = io(`https://${this.socketEndpoint}`, {
			transports: ["websocket", "polling"],
		});

		this.socket.on("connect", () => {
			console.log("Connected to socket server using WebSockets");
			this.connectionState$.set(SocketConnectionState.CONNECTED);

			// Log the active transport method
			if (this.socket) {
				const transport = this.socket.io.engine.transport.name;
				console.log(`Active transport method: ${transport}`);
			}
		});

		this.socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			this.connectionState$.set(SocketConnectionState.DISCONNECTED);
		});
	};

	/**
	 * Get the current socket transport method
	 * @returns The name of the current transport or null if not connected
	 */
	getCurrentTransport = (): string | null => {
		if (!this.socket?.connected) {
			return null;
		}
		return this.socket.io.engine.transport.name;
	};

	/**
	 * Manually reconnect to the socket server
	 * @returns Promise that resolves to true if reconnection was initiated
	 */
	reconnectToServer = async (): Promise<boolean> => {
		if (this.socket?.connected) {
			console.log("Already connected to server");
			return false;
		}

		// Disconnect existing socket if any
		if (this.socket) {
			this.socket.disconnect();
		}

		// Reinitialize socket connection
		this.initializeSocket();
		return true;
	};

	/**
	 * Check if socket is connected
	 */
	isConnected(): boolean {
		return this.socket?.connected ?? false;
	}
}

// Singleton instance export
export const socketService = new SocketService();
