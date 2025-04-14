import { fileSafeIso } from "@/utils/fileSafeIso";
import { WaveFile } from "wavefile";
import { gcsBucket } from "./gcs";

// Constants for audio processing
const SAMPLE_RATE = 16000; // 16kHz as specified
const CHANNELS = 1;

/**
 * Generate a filename based on timestamp and duration
 */
const createFilename = (isoDate: string, durationMs: number): string => {
	const fileSafeIsoDate = fileSafeIso.dateToFileName(isoDate);
	return `${fileSafeIsoDate}__${durationMs}.wav`;
};

/**
 * Convert Float32Array to WAV file
 */
function float32ToWav(
	float32Audio: Float32Array,
	sampleRate = SAMPLE_RATE,
	channels = CHANNELS,
): WaveFile {
	// Convert Float32Array to Int16Array for WAV file
	const int16Audio = new Int16Array(float32Audio.length);
	for (let i = 0; i < float32Audio.length; i++) {
		// Clip audio to [-1, 1] and scale to Int16 range
		const sample = Math.max(-1, Math.min(1, float32Audio[i]));
		int16Audio[i] = Math.round(sample * 32767);
	}

	// Create WAV file
	const wav = new WaveFile();
	wav.fromScratch(channels, sampleRate, "16", Array.from(int16Audio));
	return wav;
}

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

/**
 * Process audio data and save to GCS
 */
export async function saveRecording(
	audioData: Float32Array,
	startTime: number,
): Promise<string> {
	try {
		const durationMs = Math.round((audioData.length / SAMPLE_RATE) * 1000);

		// Convert to WAV
		const wavFile = float32ToWav(audioData);

		// Create timestamp for filename
		const timestampISO = new Date(startTime).toISOString();

		// Generate filename
		const filename = createFilename(timestampISO, durationMs);

		// Upload to GCS with metadata
		const publicUrl = await uploadToGCS(
			Buffer.from(wavFile.toBuffer()),
			filename,
			{
				duration: durationMs.toString(),
				timestamp: startTime.toString(),
				isoDate: timestampISO,
			},
		);

		console.log(
			`Processed and uploaded ${durationMs}ms voice audio file: ${filename}`,
		);

		return publicUrl;
	} catch (error) {
		console.error("Error processing audio data:", error);
		throw error;
	}
}
