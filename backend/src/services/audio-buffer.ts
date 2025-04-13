import { fileSafeIso } from "@/utils/fileSafeIso";
import { OpusEncoder } from "@discordjs/opus";
import {
	type StreamVAD,
	createStreamVAD,
} from "@ericedouard/vad-node-realtime";
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
 * Audio processor class that handles real-time voice activity detection
 */
export class AudioProcessor {
	private clientVADs: Map<string, StreamVAD> = new Map();
	private clientStartTimes: Map<string, number> = new Map();

	/**
	 * Initialize a StreamVAD for a client
	 */
	private async getOrCreateClientVAD(
		clientId: string,
		timestamp: number,
	): Promise<StreamVAD> {
		if (!this.clientVADs.has(clientId)) {
			const streamVAD = await createStreamVAD({
				onSpeechStart: () => {
					console.log(`Speech started for client ${clientId}`);
					this.clientStartTimes.set(clientId, timestamp);
				},
				onSpeechEnd: async (audio: Float32Array) => {
					console.log(
						`Speech ended for client ${clientId}, audio length: ${audio.length}`,
					);
					await this.processSpeechAudio(clientId, audio);
				},
				// Optional: customize VAD parameters
				positiveSpeechThreshold: 0.6,
				negativeSpeechThreshold: 0.4,
				minSpeechFrames: 4,
			});

			streamVAD.start();
			this.clientVADs.set(clientId, streamVAD);
		}

		return this.clientVADs.get(clientId)!;
	}

	/**
	 * Process speech audio and upload to GCS
	 */
	private async processSpeechAudio(
		clientId: string,
		audio: Float32Array,
	): Promise<void> {
		try {
			const startTime = this.clientStartTimes.get(clientId) || Date.now();
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
			console.error(
				`Error processing speech audio for client ${clientId}:`,
				error,
			);
		}
	}

	/**
	 * Process an audio packet
	 */
	async processAudioPacket(
		clientId: string,
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

				// Get or create VAD for this client
				const vad = await this.getOrCreateClientVAD(clientId, timestamp);

				// Process the audio data
				await vad.processAudio(float32Data);
			}
		} catch (error) {
			console.error(
				`Error processing audio packet for client ${clientId}:`,
				error,
			);
		}
	}

	/**
	 * Clean up resources for a client
	 */
	async cleanupClient(clientId: string): Promise<void> {
		const vad = this.clientVADs.get(clientId);
		if (vad) {
			await vad.flush(); // Process any remaining audio
			vad.destroy(); // Clean up resources
			this.clientVADs.delete(clientId);
			this.clientStartTimes.delete(clientId);
		}
	}
}

// Export a singleton instance
export const audioProcessor = new AudioProcessor();
