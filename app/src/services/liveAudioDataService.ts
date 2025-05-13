import { notifyError } from "@app/src/utils/notifyError";
import type { Subscription } from "react-native-ble-plx";
import { deviceService } from "./deviceService/deviceService";
import { offlineAudioService } from "./offlineAudioService";
import { SocketConnectionState, socketService } from "./socketService";

export const liveAudioDataService = (() => {
	let audioSubscription: Subscription | null = null;
	let audioSendInterval: NodeJS.Timeout | null = null;
	let audioPacketsBuffer: number[][] = [];
	let isSending = false;
	let bufferedMode = true;
	const sendInterval = 500;

	const sendAudioPackets = async (): Promise<void> => {
		if (audioPacketsBuffer.length === 0 || isSending) {
			return;
		}

		isSending = true;
		const packetsToSend = [...audioPacketsBuffer];
		audioPacketsBuffer = [];

		try {
			const packets = packetsToSend.map((packet) => Array.from(packet));
			socketService.getSocket().emit("audioData", {
				packets,
				timestamp: Date.now(),
			});
			// console.log(
			// 	`[liveAudioDataService] ${packetsToSend.length} audio packets sent`,
			// );
		} catch (error) {
			notifyError("liveAudioDataService", "Error sending audio data", error);
			audioPacketsBuffer = [...packetsToSend, ...audioPacketsBuffer];
		} finally {
			isSending = false;
		}
	};

	const emitSinglePacket = (packet: number[]) => {
		try {
			socketService.getSocket().emit("audioData", {
				packets: [Array.from(packet)],
				timestamp: Date.now(),
			});
			// console.log(`[liveAudioDataService] 1 audio packet sent immediately`);
		} catch (error) {
			notifyError(
				"liveAudioDataService",
				"Error sending audio data immediately",
				error,
			);
		}
	};

	// Handle socket connection state changes
	const setupSocketConnectionMonitoring = (): void => {
		socketService.connectionState$.onChange((newState) => {
			const state = newState.value;
			if (state === SocketConnectionState.DISCONNECTED) {
				console.log(
					"[liveAudioDataService] Socket disconnected, activating offline mode",
				);
				offlineAudioService.start();
			} else if (state === SocketConnectionState.CONNECTED) {
				console.log(
					"[liveAudioDataService] Socket reconnected, deactivating offline mode",
				);
				offlineAudioService.stop();
				// Future implementation: send saved files when connection is restored
			}
		});
	};

	const startAudioCollection = async (): Promise<boolean> => {
		if (!deviceService.connectedDeviceId$.peek()) {
			notifyError(
				"liveAudioDataService",
				"Cannot start audio collection: Device not connected",
			);
			return false;
		}

		audioPacketsBuffer = [];

		// Setup socket connection monitoring
		setupSocketConnectionMonitoring();

		// Check initial connection state
		if (!socketService.isConnected()) {
			// Start in offline mode if we're disconnected
			await offlineAudioService.start();
			await socketService.reconnectToServer();
		}

		try {
			const subscription = await deviceService.startAudioBytesListener(
				(processedBytes: number[]) => {
					if (processedBytes.length === 0) return;

					// Route audio data based on connection state
					if (socketService.isConnected()) {
						// Online mode: use normal buffer or immediate send
						if (bufferedMode) {
							audioPacketsBuffer.push(processedBytes);
						} else {
							emitSinglePacket(processedBytes);
						}
					} else {
						// Offline mode: send to offline service
						offlineAudioService.addAudioData(processedBytes);
					}
				},
			);

			if (subscription) {
				audioSubscription = subscription;

				if (bufferedMode && socketService.isConnected()) {
					audioSendInterval = setInterval(sendAudioPackets, sendInterval);
				}

				return true;
			}

			return false;
		} catch (error) {
			notifyError(
				"liveAudioDataService",
				"Error starting audio collection",
				error,
			);
			return false;
		}
	};

	const stopAudioCollection = async (): Promise<void> => {
		// Stop offline service
		await offlineAudioService.stop();

		if (audioSendInterval) {
			clearInterval(audioSendInterval);
			audioSendInterval = null;
			if (audioPacketsBuffer.length > 0) {
				await sendAudioPackets();
			}
		}

		if (audioSubscription) {
			audioSubscription.remove();
			audioSubscription = null;
		}
	};

	const setBufferedEmitting = (enabled: boolean): void => {
		bufferedMode = enabled;

		if (enabled) {
			if (!audioSendInterval && socketService.isConnected()) {
				audioSendInterval = setInterval(sendAudioPackets, sendInterval);
				console.log("[liveAudioDataService] Buffered emitting enabled");
			}
		} else {
			if (audioSendInterval) {
				clearInterval(audioSendInterval);
				audioSendInterval = null;
			}
			console.log(
				"[liveAudioDataService] Buffered emitting disabled, immediate mode active",
			);
		}
	};

	return {
		startAudioCollection,
		stopAudioCollection,
		setBufferedEmitting,
	};
})();
