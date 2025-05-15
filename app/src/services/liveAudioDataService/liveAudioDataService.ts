import { deviceService } from "@app/src/services/deviceService/deviceService";
import { offlineAudioService } from "@app/src/services/liveAudioDataService/offlineAudioService";
import { packetBufferService } from "@app/src/services/liveAudioDataService/packetsBufferService";
import { sendAudioPackets } from "@app/src/services/liveAudioDataService/sendAudioPackets";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
import { socketService } from "@app/src/services/socketService";
import { defer } from "@app/src/utils/defer";
import { notifyError } from "@app/src/utils/notifyError";
import { observable, when } from "@legendapp/state";
import type { AudioPacket } from "@shared/sharedTypes";
import type { Subscription } from "react-native-ble-plx";

const handlePacket = (packet: AudioPacket) => {
	const socket = socketService.getSocket();
	if (!socket || !socketService.isConnected) {
		offlineAudioService.handlePacket(packet);
		return;
	}
	// TODO: this will be removed when VAD is done on the edge
	if (liveTranscriptionService.isSpeechDetected$.peek()) {
		sendAudioPackets(socket, [packet]);
	} else {
		packetBufferService.handlePacket(packet);
	}
};

export const liveAudioDataService = (() => {
	let subscription: Subscription | undefined = undefined;
	const shouldCollectAudio$ = observable(true);

	const startAudioCollection = async () => {
		console.log("<>>>>>>>>> startAudioCollection");
		if (!deviceService.connectedDeviceId$.peek()) {
			notifyError("liveAudioDataService", "No device connected");
			return;
		}
		subscription = await deviceService.startAudioBytesListener(handlePacket);
	};

	const stopAudioCollection = async () => {
		subscription?.remove();
		subscription = undefined;
	};

	when(
		() => {
			console.log("shouldCollectAudio$", shouldCollectAudio$.get());
			console.log(
				"deviceService.connectedDeviceId$",
				deviceService.connectedDeviceId$.get(),
			);
			return (
				shouldCollectAudio$.get() && !!deviceService.connectedDeviceId$.get()
			);
		},
		() => defer(() => startAudioCollection()),
	);
	when(
		() => !shouldCollectAudio$.get() || !deviceService.connectedDeviceId$.get(),
		() => defer(() => stopAudioCollection()),
	);

	return {
		shouldCollectAudio$,
	};
})();
