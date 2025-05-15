import { socketService } from "@app/src/services/socketService";
import type { AudioPacket } from "@shared/sharedTypes";
import { Directory, File, type FileHandle, Paths } from "expo-file-system/next";

export const offlineAudioService = (() => {
	const documentAudioDir = new Directory(Paths.document, "audio_buffer");
	let currentFile: File | null = null;
	let currentFileHandle: FileHandle | null = null;

	socketService.connectionState$.onChange(({ value }) => {
		if (currentFile && currentFileHandle && value === "connected") {
			console.log("[offlineAudioService] Closing file", currentFile.uri);
			currentFileHandle.close();
			currentFile = null;
			currentFileHandle = null;
		}
	});

	const newAudioBufferFile = (): File => {
		if (!documentAudioDir.exists) {
			documentAudioDir.create({ intermediates: true });
			console.log(
				"[offlineAudioService] Created audio buffer directory at:",
				documentAudioDir.uri,
			);
		}
		const timestamp = Date.now();
		return new File(documentAudioDir, `recording_${timestamp}.bin`);
	};

	// Handle audio packet when socket is offline
	// Automatically creates a new file if no file is open
	const handlePacket = (packet: AudioPacket): void => {
		if (!currentFile) {
			currentFile = newAudioBufferFile();
			currentFile.create();
			currentFile.open();
			console.log(
				"[offlineAudioService] Created new audio buffer file:",
				currentFile.uri,
			);
		}
		if (!currentFileHandle) {
			currentFileHandle = currentFile.open();
		}
		const byteArray = new Uint8Array(packet);
		currentFileHandle.offset = currentFile.size ?? 0;
		currentFileHandle.writeBytes(byteArray);
	};

	// const sendOfflineDataToServer = async (fileName: string): Promise<void> => {
	// 	if (isActive && fileName === currentFileName) {
	// 		console.log(
	// 			`[offlineAudioService] Skipping ${fileName} as it's currently active`,
	// 		);
	// 		return;
	// 	}

	// 	const file = new File(documentAudioDir, fileName);

	// 	if (!file.exists) {
	// 		notifyError(
	// 			"offlineAudioService",
	// 			`File ${fileName} not found at ${documentAudioDir.uri}`,
	// 		);
	// 		return;
	// 	}

	// 	const blob = file.blob();
	// 	if (!blob) {
	// 		notifyError(
	// 			"offlineAudioService",
	// 			`Could not create blob for file ${fileName}.`,
	// 		);
	// 		return;
	// 	}

	// 	console.log(
	// 		`[offlineAudioService] Uploading ${fileName} (size: ${blob.size} bytes)...`,
	// 	);
	// 	isSending$.set(true);

	// 	const formData = new FormData();
	// 	formData.append("file", blob, fileName);

	// 	const [response, fetchError] = await tryCatch(
	// 		fetch(`${backendUrl}/api/offline-audio`, {
	// 			method: "POST",
	// 			body: formData,
	// 			headers: {
	// 				Cookie: authClient.getCookie(),
	// 			},
	// 		}),
	// 	);

	// 	isSending$.set(false);

	// 	if (fetchError || !response.ok) {
	// 		notifyError(
	// 			"offlineAudioService",
	// 			`Failed to upload ${fileName}: ${fetchError || response.statusText}`,
	// 		);
	// 		return;
	// 	}

	// 	file.delete();
	// 	console.log(`[offlineAudioService] Uploaded and deleted ${fileName}`);
	// 	updateSavedFilesCount();
	// };

	// const processSavedAudioFiles = async (): Promise<void> => {
	// 	console.log("[offlineAudioService] Checking for saved audio files...");
	// 	const savedFiles = listSavedAudioFiles();
	// 	if (savedFiles.length === 0) {
	// 		console.log("[offlineAudioService] No files to process.");
	// 		return;
	// 	}

	// 	// Filter out current active file if service is active
	// 	const filesToProcess =
	// 		isActive && currentFileName
	// 			? savedFiles.filter((file) => file !== currentFileName)
	// 			: savedFiles;

	// 	console.log(
	// 		`[offlineAudioService] Processing ${filesToProcess.length} files...`,
	// 	);
	// 	for (const fileName of filesToProcess) {
	// 		await sendOfflineDataToServer(fileName);
	// 	}
	// };

	return {
		handlePacket,
	};
})();
