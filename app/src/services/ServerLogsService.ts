import type { ServerLog } from "@/src/types/socket-events";
import { observable } from "@legendapp/state";
import { socketService } from "./SocketService";

export class ServerLogsService {
	public isListening = observable(false);
	public logs$ = observable<ServerLog[]>([]);

	public constructor() {
		// Get the socket from the socket service
		const socket = socketService.getSocket();

		socket.on("serverLog", (log) => {
			// Get current logs and append the new log
			this.logs$.set((currentLogs) => [...currentLogs, log]);
		});
	}

	public startListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("startLogForwarding", () => {
			this.isListening.set(true);
			console.log("Started listening to server logs");
		});
	};

	public stopListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("stopLogForwarding", () => {
			this.isListening.set(false);
			console.log("Stopped listening to server logs");
		});
	};

	public clearLogs = () => {
		this.logs$.set([]);
	};
}

export const serverLogsService = new ServerLogsService();
