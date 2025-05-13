import { deviceService } from "@app/src/services/deviceService/deviceService";
import { packetBufferService } from "@app/src/services/liveAudioDataService/packetsBufferService";
import { offlineAudioService } from "@app/src/services/offlineAudioService";
import { socketService } from "@app/src/services/socketService";
import { notifyError } from "@app/src/utils/notifyError";
import type { AudioPacket } from "@shared/sharedTypes";
import type { Subscription } from "react-native-ble-plx";

export const audioRouterService = (() => {
	let subscription: Subscription | null = null;
	let useBufferedMode = true;

	const handlePacket = (packet: AudioPacket) => {
		if (!packet.length) return;

		if (socketService.isConnected()) {
			if (useBufferedMode) {
				packetBufferService.add(packet);
			} else {
				socketService.getSocket().emit("audioData", {
					packets: [Array.from(packet)],
					timestamp: Date.now(),
				});
			}
		} else {
			offlineAudioService.addAudioData(packet);
		}
	};

	const start = async (): Promise<boolean> => {
		const deviceId = deviceService.connectedDeviceId$.peek();
		if (!deviceId) {
			notifyError("audioRouterService", "No device connected");
			return false;
		}

		const sub = await deviceService.startAudioBytesListener(handlePacket);
		if (!sub) return false;

		subscription = sub;
		if (useBufferedMode && socketService.isConnected()) {
			packetBufferService.start();
		}

		return true;
	};

	const stop = async () => {
		if (subscription) {
			subscription.remove();
			subscription = null;
		}
		await packetBufferService.stop();
	};

	const setBuffered = (enabled: boolean) => {
		useBufferedMode = enabled;
		enabled ? packetBufferService.start() : packetBufferService.stop();
	};

	return { start, stop, setBuffered };
})();
