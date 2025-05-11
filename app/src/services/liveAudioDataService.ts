import type { Subscription } from "react-native-ble-plx";
import { deviceService } from "./deviceService/deviceService";
import { socketService } from "./socketService";

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
			console.log(
				`[liveAudioDataService] ${packetsToSend.length} audio packets sent`,
			);
		} catch (error) {
			console.error("Error sending audio data:", error);
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
			console.log(`[liveAudioDataService] 1 audio packet sent immediately`);
		} catch (error) {
			console.error("Error sending audio data immediately:", error);
		}
	};

	const startAudioCollection = async (): Promise<boolean> => {
		if (!deviceService.connectedDeviceId$.peek()) {
			console.error("Cannot start audio collection: Device not connected");
			return false;
		}

		audioPacketsBuffer = [];

		if (!socketService.isConnected()) {
			await socketService.reconnectToServer();
		}

		try {
			const subscription = await deviceService.startAudioBytesListener(
				(processedBytes: number[]) => {
					if (processedBytes.length === 0) return;

					if (bufferedMode) {
						audioPacketsBuffer.push(processedBytes);
					} else {
						emitSinglePacket(processedBytes);
					}
				},
			);

			if (subscription) {
				audioSubscription = subscription;

				if (bufferedMode) {
					audioSendInterval = setInterval(sendAudioPackets, sendInterval);
				}

				return true;
			}

			return false;
		} catch (error) {
			console.error("Error starting audio collection:", error);
			return false;
		}
	};

	const stopAudioCollection = async (): Promise<void> => {
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
			if (!audioSendInterval) {
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
