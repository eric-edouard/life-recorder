import type { ServerLog } from "@/src/shared/socketEvents";
import { observable } from "@legendapp/state";
import { socketService } from "./socketService";

class ServerLogsService {
	public isListening = observable(false);
	public logs$ = observable<ServerLog[]>([]);

	constructor() {
		// Initialize socket listeners
		const socket = socketService.getSocket();

		socket.on("serverLog", (log) => {
			// Get current logs and append the new log
			this.logs$.set((currentLogs) => [...currentLogs, log]);
		});
	}

	startListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("startLogForwarding", () => {
			this.isListening.set(true);
			console.log("Started listening to server logs");
		});
	};

	stopListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("stopLogForwarding", () => {
			this.isListening.set(false);
			console.log("Stopped listening to server logs");
		});
	};

	clearLogs = () => {
		this.logs$.set([]);
	};
}

export const serverLogsService = new ServerLogsService();
