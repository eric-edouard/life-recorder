import { SAVE_RECORDINGS_TO_GCS_ENABLED } from "@/constants/features";
import { RECORDINGS_FOLDER, gcsBucket } from "@/services/external/gcs";
import { convertWavToMp3 } from "@/services/processAudioService/utils/convertWavToMp3";

/**
 * Upload an audio file to Google Cloud Storage
 */
async function uploadToGCS(
	audioBuffer: Buffer,
	filename: string,
	metadata: Record<string, string>,
	contentType: string,
): Promise<string> {
	const file = gcsBucket.file(`${RECORDINGS_FOLDER}/${filename}`);

	try {
		await file.save(audioBuffer, {
			metadata: {
				contentType,
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
	id: string,
	wavBuffer: Buffer,
	startTime: number,
	durationMs: number,
): Promise<void> => {
	if (!SAVE_RECORDINGS_TO_GCS_ENABLED) {
		return;
	}

	try {
		// Convert WAV to MP3
		const mp3Buffer = await convertWavToMp3(wavBuffer);

		// Generate filename
		const filename = `${id}.mp3`;

		// Upload to GCS with metadata
		await uploadToGCS(
			mp3Buffer,
			filename,
			{
				startTimestamp: startTime.toString(),
				durationMs: durationMs.toString(),
			},
			"audio/mpeg",
		);

		console.log(
			`Processed and uploaded ${durationMs}ms voice audio file: ${filename}`,
		);
	} catch (error) {
		console.error("Error processing speech audio:", error);
	}
};
