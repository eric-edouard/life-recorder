import type { ServerLog } from "@/src/shared/socketEvents";
import { observable } from "@legendapp/state";
import { socketService } from "./socketService1";

export const serverLogsService = (() => {
	const isListening = observable(false);
	const logs$ = observable<ServerLog[]>([]);

	// Initialize socket listeners
	(() => {
		// Get the socket from the socket service
		const socket = socketService.getSocket();

		socket.on("serverLog", (log) => {
			// Get current logs and append the new log
			logs$.set((currentLogs) => [...currentLogs, log]);
		});
	})();

	const startListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("startLogForwarding", () => {
			isListening.set(true);
			console.log("Started listening to server logs");
		});
	};

	const stopListeningToServerLogs = () => {
		const socket = socketService.getSocket();

		socket.emit("stopLogForwarding", () => {
			isListening.set(false);
			console.log("Stopped listening to server logs");
		});
	};

	const clearLogs = () => {
		logs$.set([]);
	};

	return {
		isListening,
		logs$,
		startListeningToServerLogs,
		stopListeningToServerLogs,
		clearLogs,
	};
})();
