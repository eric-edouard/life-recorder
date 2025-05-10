import * as FileSystem from "expo-file-system";

const OFFLINE_AUDIO_DIR = `${FileSystem.documentDirectory}offline_audio/`;

const ensureAudioDirExists = async () => {
	const dirInfo = await FileSystem.getInfoAsync(OFFLINE_AUDIO_DIR);
	if (!dirInfo.exists) {
		console.log(
			"[offlineAudioPersistenceService] Creating offline audio directory:",
			OFFLINE_AUDIO_DIR,
		);
		await FileSystem.makeDirectoryAsync(OFFLINE_AUDIO_DIR, {
			intermediates: true,
		});
	}
};

// Ensure directory exists when the service is loaded
ensureAudioDirExists().catch((error) =>
	console.error(
		"[offlineAudioPersistenceService] Failed to create offline audio dir on init:",
		error,
	),
);

const saveAudioPacket = async (packet: number[]): Promise<void> => {
	if (packet.length === 0) {
		console.warn(
			"[offlineAudioPersistenceService] Attempted to save an empty audio packet.",
		);
		return;
	}

	try {
		const filename = `offline_audio_${Date.now()}.bin`;
		const filePath = OFFLINE_AUDIO_DIR + filename; // Note: template literal could also be used here.

		const fileContent = packet
			.map((byte) => String.fromCharCode(byte))
			.join("");

		await FileSystem.writeAsStringAsync(filePath, fileContent, {
			encoding: FileSystem.EncodingType.UTF8,
		});
		// console.log(
		// 	`[offlineAudioPersistenceService] Saved offline audio packet to: ${filename}`,
		// );
	} catch (error) {
		console.error(
			"[offlineAudioPersistenceService] Error saving packet to file:",
			error,
		);
	}
};

export const offlineAudioPersistenceService = {
	saveAudioPacket,
	// In the future, methods like readAudioPackets, deleteAudioPacket etc. will go here
};
