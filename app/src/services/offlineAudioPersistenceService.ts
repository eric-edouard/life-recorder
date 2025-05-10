import * as FileSystem from "expo-file-system";

const OFFLINE_AUDIO_DIR = `${FileSystem.documentDirectory}offline_audio/`;

// Configuration for flushing
const FLUSH_INTERVAL_MS = 10_000; // 10 seconds
const MAX_BUFFER_PACKETS_BEFORE_FLUSH = 250; // Approx 5 seconds of audio (50Hz * 5s = 250 packets)

let privateBuffer: number[][] = [];
let flushIntervalId: NodeJS.Timeout | null = null;

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

const flushBufferToFile = async (): Promise<void> => {
	if (privateBuffer.length === 0) {
		// console.log("[offlineAudioPersistenceService] Buffer is empty, nothing to flush.");
		return;
	}

	// Take a snapshot of the buffer and clear the original immediately
	const packetsToFlush = [...privateBuffer];
	privateBuffer = [];

	console.log(
		`[offlineAudioPersistenceService] Flushing ${packetsToFlush.length} packets to file.`,
	);

	try {
		// Concatenate all packets into a single byte array
		const concatenatedBytesList: number[] = [];
		for (const packet of packetsToFlush) {
			concatenatedBytesList.push(...packet);
		}

		if (concatenatedBytesList.length === 0) {
			console.warn(
				"[offlineAudioPersistenceService] Concatenated bytes list is empty, skipping file write.",
			);
			return;
		}

		const uint8Array = new Uint8Array(concatenatedBytesList);
		const base64Content = Buffer.from(uint8Array).toString("base64");

		const filename = `offline_batch_${Date.now()}.b64`;
		const filePath = `${OFFLINE_AUDIO_DIR}${filename}`;

		await FileSystem.writeAsStringAsync(filePath, base64Content, {
			encoding: FileSystem.EncodingType.Base64,
		});
		console.log(
			`[offlineAudioPersistenceService] Successfully flushed ${packetsToFlush.length} packets to: ${filename}`,
		);
	} catch (error) {
		console.error(
			"[offlineAudioPersistenceService] Error flushing buffer to file:",
			error,
		);
		// OPTIONAL: Consider re-adding packetsToFlush to privateBuffer if write fails.
		// This could be: privateBuffer.unshift(...packetsToFlush);
		// However, be cautious of potential loops if file writing consistently fails.
		// For now, logging the error means these packets are lost for this flush attempt.
	}
};

const saveAudioPacket = async (packet: number[]): Promise<void> => {
	if (packet.length === 0) {
		// console.warn("[offlineAudioPersistenceService] Attempted to save an empty audio packet.");
		return;
	}

	privateBuffer.push(packet);

	if (privateBuffer.length >= MAX_BUFFER_PACKETS_BEFORE_FLUSH) {
		console.log(
			`[offlineAudioPersistenceService] Buffer reached ${privateBuffer.length} packets, triggering flush.`,
		);
		await flushBufferToFile(); // Await to ensure this flush completes before more packets might trigger it.
	}
};

const initialize = () => {
	if (flushIntervalId) {
		clearInterval(flushIntervalId);
	}
	// Ensure the directory exists before starting operations
	ensureAudioDirExists()
		.then(() => {
			flushIntervalId = setInterval(flushBufferToFile, FLUSH_INTERVAL_MS);
			console.log(
				`[offlineAudioPersistenceService] Initialized with flush interval: ${FLUSH_INTERVAL_MS}ms`,
			);
		})
		.catch((error) => {
			console.error(
				"[offlineAudioPersistenceService] Failed to ensure directory exists during initialization. Periodic flush not started.",
				error,
			);
		});
};

const cleanup = async () => {
	if (flushIntervalId) {
		clearInterval(flushIntervalId);
		flushIntervalId = null;
	}
	console.log(
		"[offlineAudioPersistenceService] Cleaning up, performing final flush.",
	);
	await flushBufferToFile();
};

export const offlineAudioPersistenceService = {
	initialize,
	saveAudioPacket,
	cleanup,
	flushBufferToFile, // Exposing for potential manual trigger (e.g., AppState change)
};
