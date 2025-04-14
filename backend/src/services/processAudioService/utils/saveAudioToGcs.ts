import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import { gcsBucket } from "@/services/external/gcs";
import { fileSafeIso } from "@/utils/fileSafeIso";

/**
 * Generate a filename based on timestamp and duration
 */
const createFilename = (isoDate: string, durationMs: number): string => {
	const fileSafeIsoDate = fileSafeIso.dateToFileName(isoDate);
	return `${fileSafeIsoDate}__${durationMs}.wav`;
};

/**
 * Upload a WAV file to Google Cloud Storage
 */
async function uploadToGCS(
	wavBuffer: Buffer,
	filename: string,
	metadata: Record<string, string>,
): Promise<string> {
	const file = gcsBucket.file(`audio_recordings/${filename}`);

	try {
		await file.save(wavBuffer, {
			metadata: {
				contentType: "audio/wav",
				metadata,
			},
		});

		return file.publicUrl();
	} catch (error) {
		console.error("Error uploading to GCS:", error);
		throw error;
	}
}

export const saveAudioToGCS = async (
	wavBuffer: Buffer,
	startTime: number,
): Promise<void> => {
	try {
		// Get audio duration from metadata (passed from parent function)
		// We have to estimate the duration from the buffer size
		// WAV header is 44 bytes, and the rest is audio data
		// Each sample is 2 bytes (16-bit) per channel
		const audioDataSize = wavBuffer.length - 44;
		const bytesPerSample = 2 * CHANNELS;
		const samples = audioDataSize / bytesPerSample;
		const durationMs = Math.round((samples / SAMPLE_RATE) * 1000);

		// Create timestamp for filename
		const timestampISO = new Date(startTime).toISOString();

		// Generate filename
		const filename = createFilename(timestampISO, durationMs);

		// Upload to GCS with metadata
		await uploadToGCS(wavBuffer, filename, {
			duration: durationMs.toString(),
			timestamp: startTime.toString(),
			isoDate: timestampISO,
		});

		console.log(
			`Processed and uploaded ${durationMs}ms voice audio file: ${filename}`,
		);
	} catch (error) {
		console.error("Error processing speech audio:", error);
	}
};
