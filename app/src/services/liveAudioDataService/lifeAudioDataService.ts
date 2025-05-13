import { audioRouterService } from "@app/src/services/liveAudioDataService/audioRouterService";
import { offlineAudioService } from "@app/src/services/offlineAudioService";
import {
	SocketConnectionState,
	socketService,
} from "@app/src/services/socketService";

export const liveAudioDataService = (() => {
	const startAudioCollection = async () => {
		socketService.connectionState$.onChange((state) => {
			if (state.value === SocketConnectionState.CONNECTED) {
				offlineAudioService.stop();
			} else {
				offlineAudioService.start();
			}
		});

		if (!socketService.isConnected()) {
			await offlineAudioService.start();
			await socketService.reconnectToServer();
		}

		return await audioRouterService.start();
	};

	const stopAudioCollection = async () => {
		await offlineAudioService.stop();
		await audioRouterService.stop();
	};

	const setBufferedEmitting = (enabled: boolean) => {
		audioRouterService.setBuffered(enabled);
	};

	return {
		startAudioCollection,
		stopAudioCollection,
		setBufferedEmitting,
	};
})();
