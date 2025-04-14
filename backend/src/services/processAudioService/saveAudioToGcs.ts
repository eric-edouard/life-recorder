import { SAMPLE_RATE } from "@/constants/audioConstants";
import { gcsBucket } from "@/services/gcs";
import { convertAudioToWav } from "@/services/processAudioService/convertAudioToWav";
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
	audio: Float32Array,
	startTime: number,
): Promise<void> => {
	try {
		const durationMs = Math.round((audio.length / SAMPLE_RATE) * 1000);

		// Convert to WAV
		const wavFile = convertAudioToWav(audio);

		// Create timestamp for filename
		const timestampISO = new Date(startTime).toISOString();

		// Generate filename
		const filename = createFilename(timestampISO, durationMs);

		// Upload to GCS with metadata
		await uploadToGCS(Buffer.from(wavFile.toBuffer()), filename, {
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
