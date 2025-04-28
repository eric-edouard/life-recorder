// import { socketHandleAudioData } from "@backend/src/services/socketService/socketHandleAudioData";
// import type { SocketHandlerMap } from "@backend/src/services/socketService/types";
// import { getUtterances } from "@backend/src/services/utterancesService";

// export const socketHandlers: SocketHandlerMap = {
// 	ping: (_socket, nb) => {
// 		console.log("[socketService] Ping received", nb);
// 		return () => {};
// 	},

// 	getUtterances: (_socket, params, callback) => {
// 		console.log("[socketService] getUtterances received");
// 		getUtterances(params).then((utterances) => {
// 			callback(utterances, null);
// 		});
// 		return () => {};
// 	},

// 	audioData: (socket, data, callback) => {
// 		console.log("[socketService] Audio data received");
// 		// Immediately acknowledge receipt
// 		callback(true);

// 		try {
// 			// console.log(
// 			// 	`Received audio data. Timestamp: ${data.timestamp}, Packets: ${data.packets.length}`,
// 			// );

// 			// Process each packet individually
// 			for (const packetData of data.packets) {
// 				// Convert number array to ArrayBuffer
// 				const arrayBuffer = new Uint8Array(packetData).buffer;

// 				// Send directly to audio processor
// 				void processAudioService.processAudioPacket(
// 					arrayBuffer,
// 					data.timestamp,
// 				);
// 			}

// 			console.log(`Processed ${data.packets.length} audio packets`);
// 		} catch (error) {
// 			console.error("Error processing audio data:", error);
// 		}

// 		// Return a cleanup function
// 		return () => {
// 			console.log("[socketService] Cleaning up audio");
// 			processAudioService.handleClientDisconnect();
// 		};
// 	},

// 	startLogForwarding: (_socket, callback) => {
// 		console.log("[socketService] Start log forwarding");
// 		callback(true);
// 		return () => {};
// 	},

// 	stopLogForwarding: (_socket, callback) => {
// 		console.log("[socketService] Stop log forwarding");
// 		callback(true);
// 		return () => {};
// 	},
// };
