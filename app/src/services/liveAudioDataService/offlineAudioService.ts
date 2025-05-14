import { backendUrl } from "@app/src/constants/backendUrl";
import { authClient } from "@app/src/services/authClient";
import { notifyError } from "@app/src/utils/notifyError";
import { tryCatch } from "@app/src/utils/tryCatch";
import { observable } from "@legendapp/state";
import type { AudioPacket } from "@shared/sharedTypes";
import { Directory, File, Paths } from "expo-file-system/next";
import { fetch } from "expo/fetch";

export const offlineAudioService = (() => {
	const documentAudioDir = new Directory(Paths.document, "audio_buffer");
	const nbSavedFiles$ = observable(0);
	const isSending$ = observable(false);

	let saveInterval: NodeJS.Timeout | null = null;
	const saveIntervalTime = 10000; // Save every 10 seconds
	let offlineBuffer: AudioPacket[] = [];
	let isActive = false;

	// Initialize audio buffer directory
	const initAudioBufferDir = () => {
		if (!documentAudioDir.exists) {
			documentAudioDir.create({ intermediates: true });
			console.log(
				"[offlineAudioService] Created audio buffer directory at:",
				documentAudioDir.uri,
			);
		}
		// Update nbSavedFiles with current count
		updateSavedFilesCount();
	};

	// Update the saved files count
	const updateSavedFilesCount = (): void => {
		const files = listSavedAudioFiles();
		nbSavedFiles$.set(files.length);
	};

	// Save current buffer to filesystem
	const saveBufferToFileSystem = async (): Promise<void> => {
		if (offlineBuffer.length === 0) return;

		const timestamp = Date.now();
		const fileName = `${timestamp}.json`;

		const file = new File(documentAudioDir, fileName);

		const packetsToSave = [...offlineBuffer];
		const fileContent = JSON.stringify({
			packets: packetsToSave,
			timestamp,
		});

		file.write(fileContent);

		// Only clear the buffer after successful write
		offlineBuffer = [];

		console.log(
			`[offlineAudioService] Saved ${packetsToSave.length} audio packets to ${file.uri}.
				File size: ${new TextEncoder().encode(fileContent).length} bytes`,
		);

		// Update saved files count after saving
		updateSavedFilesCount();
	};

	// Start the offline audio service
	const start = (): void => {
		if (isActive) return;

		initAudioBufferDir();

		// Start periodic saving
		if (!saveInterval) {
			saveInterval = setInterval(saveBufferToFileSystem, saveIntervalTime);
		}

		isActive = true;
		console.log("[offlineAudioService] Started offline audio service");
	};

	// Stop the offline audio service
	const stop = (): void => {
		if (!isActive) return;

		// Save any remaining data
		saveBufferToFileSystem();

		// Clear the interval
		if (saveInterval) {
			clearInterval(saveInterval);
			saveInterval = null;
		}

		isActive = false;
		console.log("[offlineAudioService] Stopped offline audio service");
	};

	// Add audio data to offline buffer
	const addAudioData = (audioData: AudioPacket): void => {
		if (!isActive) return;

		offlineBuffer.push(audioData);
	};

	// Check if the service is currently active
	const isServiceActive = (): boolean => {
		return isActive;
	};

	// List saved audio files
	const listSavedAudioFiles = (): string[] => {
		const items = documentAudioDir.list();

		// Ensure items is not null before filtering and mapping
		if (!items) return [];

		return items
			.filter((item) => item instanceof File && item.name.endsWith(".json"))
			.map((file) => (file as File).name);
	};

	// Send data from a single file to the server and delete if successful
	const sendOfflineDataToServer = async (
		fileName: string, // Just the name of the file
	): Promise<void> => {
		const file = new File(documentAudioDir, fileName);

		if (!file.exists) {
			notifyError(
				"offlineAudioService",
				`File ${fileName} not found at ${documentAudioDir.uri} for upload.`,
			);
			return;
		}

		const blob = file.blob();
		if (!blob) {
			notifyError(
				"offlineAudioService",
				`Could not create blob for file ${fileName}.`,
			);
			return;
		}

		console.log(
			`[offlineAudioService] Attempting to upload ${fileName} (size: ${blob.size} bytes)...`,
		);

		// Set isSending to true before starting the upload
		isSending$.set(true);

		// Create FormData and append the blob as a file
		const formData = new FormData();
		formData.append("file", blob, fileName);

		const [response, fetchError] = await tryCatch(
			fetch(`${backendUrl}/api/offline-audio`, {
				method: "POST",
				body: formData, // Use formData instead of blob directly
				headers: {
					Cookie: authClient.getCookie(),
					// Don't set Content-Type header when using FormData,
					// the browser will set it automatically with the correct boundary
				},
			}),
		);

		// Set isSending to false after the upload attempt completes
		isSending$.set(false);

		if (fetchError) {
			notifyError(
				"offlineAudioService",
				`Fetch error while uploading ${fileName}:`,
				fetchError,
			);
			return;
		}

		if (!response.ok) {
			notifyError(
				"offlineAudioService",
				`Failed to upload ${fileName}. Server responded with ${response.status}: ${response.statusText}`,
			);
			return;
		}

		file.delete();
		console.log(
			`[offlineAudioService] Successfully uploaded and deleted ${fileName}`,
		);

		// Update saved files count after deleting a file
		updateSavedFilesCount();
	};

	// Process all saved audio files
	const processSavedAudioFiles = async (): Promise<void> => {
		console.log(
			"[offlineAudioService] Checking for saved audio files to process...",
		);
		const savedFiles = listSavedAudioFiles();

		if (savedFiles.length === 0) {
			console.log("[offlineAudioService] No saved audio files to process.");
			return;
		}

		console.log(
			`[offlineAudioService] Found ${savedFiles.length} saved audio files. Processing one by one...`,
		);

		for (const fileName of savedFiles) {
			await sendOfflineDataToServer(fileName);
		}
		console.log("[offlineAudioService] Finished processing saved audio files.");
	};

	return {
		start,
		stop,
		addAudioData,
		isServiceActive,
		listSavedAudioFiles,
		processSavedAudioFiles,
		nbSavedFiles$: nbSavedFiles$,
		isSending$: isSending$,
	};
})();
