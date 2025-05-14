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

	let isActive = false;
	let currentFile: File | null = null;
	let currentFileName: string | null = null;

	const initAudioBufferDir = () => {
		if (!documentAudioDir.exists) {
			documentAudioDir.create({ intermediates: true });
			console.log(
				"[offlineAudioService] Created audio buffer directory at:",
				documentAudioDir.uri,
			);
		}
		updateSavedFilesCount();
	};

	const updateSavedFilesCount = (): void => {
		const files = listSavedAudioFiles();
		nbSavedFiles$.set(files.length);
	};

	const listSavedAudioFiles = (): string[] => {
		const items = documentAudioDir.list();
		if (!items) return [];

		return items
			.filter((item) => item instanceof File && item.name.endsWith(".bin"))
			.map((file) => (file as File).name);
	};

	const startSessionFile = (): void => {
		if (isActive) return;

		initAudioBufferDir();

		const timestamp = Date.now();
		currentFileName = `recording_${timestamp}.bin`;
		currentFile = new File(documentAudioDir, currentFileName);
		currentFile.create();

		isActive = true;
		console.log(
			"[offlineAudioService] Started with session file:",
			currentFileName,
		);
	};

	const stopSessionFile = (): void => {
		if (!isActive) return;

		currentFile = null;
		currentFileName = null;
		isActive = false;

		updateSavedFilesCount();
		console.log("[offlineAudioService] Stopped offline audio service");
	};

	const appendAudioData = async (audioData: AudioPacket): Promise<void> => {
		if (!isActive || !currentFile) return;

		// Check if file still exists before attempting to write
		if (!currentFile.exists) {
			console.log(
				"[offlineAudioService] Cannot write to file - file no longer exists",
			);
			return;
		}

		const byteArray = new Uint8Array(audioData);
		try {
			const handle = await currentFile.open();
			handle.offset = currentFile.size ?? 0;
			await handle.writeBytes(byteArray);
			await handle.close();
		} catch (err) {
			console.error("[offlineAudioService] Failed to write audio packet:", err);
		}
	};

	const isServiceActive = (): boolean => isActive;

	const sendOfflineDataToServer = async (fileName: string): Promise<void> => {
		if (isActive && fileName === currentFileName) {
			console.log(
				`[offlineAudioService] Skipping ${fileName} as it's currently active`,
			);
			return;
		}

		const file = new File(documentAudioDir, fileName);

		if (!file.exists) {
			notifyError(
				"offlineAudioService",
				`File ${fileName} not found at ${documentAudioDir.uri}`,
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
			`[offlineAudioService] Uploading ${fileName} (size: ${blob.size} bytes)...`,
		);
		isSending$.set(true);

		const formData = new FormData();
		formData.append("file", blob, fileName);

		const [response, fetchError] = await tryCatch(
			fetch(`${backendUrl}/api/offline-audio`, {
				method: "POST",
				body: formData,
				headers: {
					Cookie: authClient.getCookie(),
				},
			}),
		);

		isSending$.set(false);

		if (fetchError || !response.ok) {
			notifyError(
				"offlineAudioService",
				`Failed to upload ${fileName}: ${fetchError || response.statusText}`,
			);
			return;
		}

		file.delete();
		console.log(`[offlineAudioService] Uploaded and deleted ${fileName}`);
		updateSavedFilesCount();
	};

	const processSavedAudioFiles = async (): Promise<void> => {
		console.log("[offlineAudioService] Checking for saved audio files...");
		const savedFiles = listSavedAudioFiles();
		if (savedFiles.length === 0) {
			console.log("[offlineAudioService] No files to process.");
			return;
		}

		// Filter out current active file if service is active
		const filesToProcess =
			isActive && currentFileName
				? savedFiles.filter((file) => file !== currentFileName)
				: savedFiles;

		console.log(
			`[offlineAudioService] Processing ${filesToProcess.length} files...`,
		);
		for (const fileName of filesToProcess) {
			await sendOfflineDataToServer(fileName);
		}
	};

	return {
		startSessionFile,
		stopSessionFile,
		appendAudioData,
		isServiceActive,
		listSavedAudioFiles,
		processSavedAudioFiles,
		nbSavedFiles$,
		isSending$,
	};
})();
