import { audioRouterService } from "@app/src/services/liveAudioDataService/audioRouterService";
import { offlineAudioService } from "@app/src/services/liveAudioDataService/offlineAudioService";
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
				offlineAudioService.stopSessionFile();
				// When connection is back, process any saved offline files
				offlineAudioService.processSavedAudioFiles();
			} else {
				offlineAudioService.startSessionFile();
			}
		});

		if (!socketService.isConnected()) {
			await offlineAudioService.startSessionFile();
			await socketService.reconnectToServer();
		}

		// Only start audioRouterService if still listening after potential reconnections
		if (shouldListen$.peek()) {
			return await audioRouterService.start();
		}
	};

	const stopAudioCollection = async () => {
		await offlineAudioService.stopSessionFile();
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
