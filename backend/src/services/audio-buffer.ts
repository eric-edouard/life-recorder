import { fileSafeIso } from "@/utils/fileSafeIso";
import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";
import { WaveFile } from "wavefile";
import { gcsBucket } from "./gcs";

// Constants for audio processing
const SAMPLE_RATE = 16000; // 16kHz as specified
const CHANNELS = 1;
const OPUS_PACKET_DURATION_MS = 20; // Each Opus packet represents 20ms of audio

const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

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
 * Audio processor for real-time voice activity detection
 */
export class AudioProcessor {
	private streamVAD: RealTimeVAD | null = null;
	private speechStartTime = 0;

	constructor() {
		this.initVAD();
	}

	/**
	 * Initialize VAD
	 */
	private async initVAD(): Promise<void> {
		this.streamVAD = await RealTimeVAD.new({
			onSpeechStart: () => {
				console.log("Speech started");
				this.speechStartTime = Date.now();
			},
			onSpeechEnd: async (audio: Float32Array) => {
				console.log(`Speech ended, audio length: ${audio.length}`);
				await this.processSpeechAudio(audio);
			},
			// Optional: customize VAD parameters
			positiveSpeechThreshold: 0.6,
			negativeSpeechThreshold: 0.4,
			minSpeechFrames: 4,
		});

		this.streamVAD.start();
	}

	/**
	 * Process speech audio and upload to GCS
	 */
	private async processSpeechAudio(audio: Float32Array): Promise<void> {
		try {
			const startTime = this.speechStartTime;
			const durationMs = Math.round((audio.length / SAMPLE_RATE) * 1000);

			// Convert to WAV
			const wavFile = float32ToWav(audio);

			// Create timestamp for filename
			const timestampISO = new Date(startTime).toISOString();

			// Generate filename
			const filename = createFilename(timestampISO, durationMs);

			// Upload to GCS with metadata
			await uploadToGCS(Buffer.from(wavFile.toBuffer()), filename, {
				"has-voice": "true",
				duration: durationMs.toString(),
				timestamp: startTime.toString(),
			});

			console.log(
				`Processed and uploaded ${durationMs}ms voice audio file: ${filename}`,
			);
		} catch (error) {
			console.error("Error processing speech audio:", error);
		}
	}

	/**
	 * Process an audio packet
	 */
	async processAudioPacket(
		audioBuffer: ArrayBuffer,
		timestamp: number,
	): Promise<void> {
		try {
			// Convert ArrayBuffer to Buffer
			const packet = Buffer.from(audioBuffer);

			// Decode Opus packet to PCM
			const pcmData = opusEncoder.decode(packet);

			if (pcmData && pcmData.length > 0) {
				// Convert Buffer to Float32Array for VAD
				const float32Data = new Float32Array(pcmData.length / 2);

				for (let i = 0; i < float32Data.length; i++) {
					// Extract 16-bit samples and normalize to [-1, 1]
					const sample = pcmData.readInt16LE(i * 2);
					float32Data[i] = sample / 32768.0;
				}

				// Process the audio data with VAD
				if (this.streamVAD) {
					await this.streamVAD.processAudio(float32Data);
				} else {
					throw new Error("VAD not initialized");
				}
			}
		} catch (error) {
			console.error("Error processing audio packet:", error);
		}
	}

	/**
	 * Clean up resources
	 */
	async cleanup(): Promise<void> {
		if (this.streamVAD) {
			await this.streamVAD.flush(); // Process any remaining audio
			this.streamVAD.destroy(); // Clean up resources
			this.streamVAD = null;
		}
	}
}

// Export a singleton instance
export const audioProcessor = new AudioProcessor();
