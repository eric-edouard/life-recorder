import * as FileSystem from "expo-file-system";

export const offlineAudioService = (() => {
	const audioBufferDir = `${FileSystem.documentDirectory}audio_buffer/`;
	let saveInterval: NodeJS.Timeout | null = null;
	const saveIntervalTime = 10000; // Save every 10 seconds
	let offlineBuffer: number[][] = [];
	let isActive = false;

	// Initialize audio buffer directory
	const initAudioBufferDir = async (): Promise<void> => {
		try {
			const dirInfo = await FileSystem.getInfoAsync(audioBufferDir);
			if (!dirInfo.exists) {
				await FileSystem.makeDirectoryAsync(audioBufferDir, {
					intermediates: true,
				});
				console.log("[offlineAudioService] Created audio buffer directory");
			}
		} catch (error) {
			console.error(
				"[offlineAudioService] Error initializing audio buffer directory:",
				error,
			);
		}
	};

	// Save current buffer to filesystem
	const saveBufferToFileSystem = async (): Promise<void> => {
		if (offlineBuffer.length === 0) return;

		try {
			const timestamp = Date.now();
			const fileName = `${timestamp}.json`;
			const filePath = `${audioBufferDir}${fileName}`;

			const packetsToSave = [...offlineBuffer];
			const fileContent = JSON.stringify({
				packets: packetsToSave,
				timestamp,
			});

			await FileSystem.writeAsStringAsync(filePath, fileContent);

			// Only clear the buffer after successful write
			offlineBuffer = [];

			console.log(
				`[offlineAudioService] Saved ${packetsToSave.length} audio packets to ${fileName}`,
			);
		} catch (error) {
			console.error(
				"[offlineAudioService] Error saving audio buffer to filesystem:",
				error,
			);
		}
	};

	// Start the offline audio service
	const start = async (): Promise<void> => {
		if (isActive) return;

		await initAudioBufferDir();

		// Start periodic saving
		if (!saveInterval) {
			saveInterval = setInterval(saveBufferToFileSystem, saveIntervalTime);
		}

		isActive = true;
		console.log("[offlineAudioService] Started offline audio service");
	};

	// Stop the offline audio service
	const stop = async (): Promise<void> => {
		if (!isActive) return;

		// Save any remaining data
		await saveBufferToFileSystem();

		// Clear the interval
		if (saveInterval) {
			clearInterval(saveInterval);
			saveInterval = null;
		}

		isActive = false;
		console.log("[offlineAudioService] Stopped offline audio service");
	};

	// Add audio data to offline buffer
	const addAudioData = (audioData: number[]): void => {
		if (!isActive) return;

		offlineBuffer.push(audioData);
	};

	// Check if the service is currently active
	const isServiceActive = (): boolean => {
		return isActive;
	};

	// List saved audio files
	const listSavedAudioFiles = async (): Promise<string[]> => {
		try {
			const files = await FileSystem.readDirectoryAsync(audioBufferDir);
			return files.filter((file) => file.endsWith(".json"));
		} catch (error) {
			console.error(
				"[offlineAudioService] Error listing saved audio files:",
				error,
			);
			return [];
		}
	};

	return {
		start,
		stop,
		addAudioData,
		isServiceActive,
		listSavedAudioFiles,
	};
})();
