import { audioRouterService } from "@app/src/services/liveAudioDataService/audioRouterService";
import { offlineAudioService } from "@app/src/services/offlineAudioService";
import {
	SocketConnectionState,
	socketService,
} from "@app/src/services/socketService";
import { observable } from "@legendapp/state";

export const liveAudioDataService = (() => {
	const shouldListen$ = observable(true);

	const startAudioCollection = async () => {
		if (!shouldListen$.peek()) {
			return;
		}

		socketService.connectionState$.onChange((state) => {
			if (!shouldListen$.peek()) {
				return;
			}
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

		// Only start audioRouterService if still listening after potential reconnections
		if (shouldListen$.peek()) {
			return await audioRouterService.start();
		}
	};

	const stopAudioCollection = async () => {
		await offlineAudioService.stop();
		await audioRouterService.stop();
	};

	const toggleListening = async () => {
		shouldListen$.set((prev) => !prev);
		if (shouldListen$.peek()) {
			await startAudioCollection();
		} else {
			await stopAudioCollection();
		}
	};

	const setBufferedEmitting = (enabled: boolean) => {
		audioRouterService.setBuffered(enabled);
	};

	return {
		shouldListen$,
		startAudioCollection,
		stopAudioCollection,
		toggleListening,
		setBufferedEmitting,
	};
})();
