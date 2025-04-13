import { fileSafeIso } from "@/utils/fileSafeIso";
import { OpusEncoder } from "@discordjs/opus";
import { createStreamVAD } from "@ericedouard/vad-node-realtime";
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
	return `${fileSafeIsoDate}__${durationMs}__VOICE_DETECTED.wav`;
};

/**
 * Convert Opus packets to a WAV file
 */
function opusPacketsToWav(
	opusPackets: Buffer[],
	sampleRate = SAMPLE_RATE,
	channels = CHANNELS,
): WaveFile {
	// Decode each opus packet to PCM and collect the results
	const allPcmData: Int16Array[] = [];
	let totalSamples = 0;

	for (const packet of opusPackets) {
		// Decode the current packet
		const pcmData = opusEncoder.decode(packet);

		if (pcmData && pcmData.length > 0) {
			// Convert Buffer to Int16Array (PCM 16-bit format)
			const int16Data = new Int16Array(
				pcmData.buffer,
				pcmData.byteOffset,
				pcmData.byteLength / 2,
			);
			allPcmData.push(int16Data);
			totalSamples += int16Data.length;
		}
	}

	// If no packets were successfully decoded, throw error
	if (allPcmData.length === 0) {
		throw new Error("Failed to decode any Opus packets");
	}

	// Combine all PCM data into a single array
	const combinedPcmData = new Int16Array(totalSamples);
	let offset = 0;

	for (const pcmChunk of allPcmData) {
		combinedPcmData.set(pcmChunk, offset);
		offset += pcmChunk.length;
	}

	// Create WAV file
	const wav = new WaveFile();

	// Create a 16-bit PCM WAV file from the combined PCM data
	wav.fromScratch(channels, sampleRate, "16", Array.from(combinedPcmData));

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
 * Audio buffer manager to process audio with VAD
 */
export class AudioBufferManager {
	private vad: any; // StreamVAD instance
	private packets: Buffer[] = [];
	private isInitialized = false;
	private currentTimestamp = 0;

	/**
	 * Initialize the VAD instance
	 */
	private async initialize(): Promise<void> {
		if (this.isInitialized) return;

		// Create a new StreamVAD instance
		this.vad = await createStreamVAD({
			sampleRate: SAMPLE_RATE,
			onSpeechStart: () => {
				console.log("Speech started");
				// Store the timestamp of the first packet when speech starts
				// We'll keep the current timestamp for this speech segment
			},
			onSpeechEnd: async (audio: Float32Array) => {
				try {
					// Only process if we have packets
					if (this.packets.length === 0) return;

					// Save only speech segments to GCS
					const durationMs = this.packets.length * OPUS_PACKET_DURATION_MS;

					// Create a WAV file from the opus packets
					const wavFile = opusPacketsToWav(this.packets);

					// Create timestamp for filename
					const timestampISO = new Date(this.currentTimestamp).toISOString();

					// Generate filename
					const filename = createFilename(timestampISO, durationMs);

					// Upload to GCS with metadata
					await uploadToGCS(Buffer.from(wavFile.toBuffer()), filename, {
						"has-voice": "true",
						duration: durationMs.toString(),
						timestamp: this.currentTimestamp.toString(),
					});

					console.log(
						`Processed and uploaded ${durationMs}ms voice audio: ${filename}`,
					);

					// Reset packets after successfully processing
					this.packets = [];
				} catch (error) {
					console.error("Error processing speech audio:", error);
				}
			},
			// Optional parameters for voice detection
			positiveSpeechThreshold: 0.6,
			negativeSpeechThreshold: 0.4,
			minSpeechFrames: 4,
		});

		// Start the VAD
		this.vad.start();
		this.isInitialized = true;
	}

	/**
	 * Add an audio packet to the stream
	 */
	async addPacket(audioBuffer: ArrayBuffer, timestamp: number): Promise<void> {
		// Initialize if needed
		if (!this.isInitialized) {
			await this.initialize();
		}

		// Store timestamp of first packet if buffer is empty
		if (this.packets.length === 0) {
			this.currentTimestamp = timestamp;
		}

		// Convert ArrayBuffer to Buffer for storage
		const packet = Buffer.from(audioBuffer);

		// Store the packet for later WAV creation
		this.packets.push(packet);

		// Decode the opus packet to get PCM data
		const pcmData = opusEncoder.decode(packet);

		if (pcmData && pcmData.length > 0) {
			// Convert to Float32Array for VAD processing
			const float32Data = new Float32Array(pcmData.length / 2);
			const int16View = new Int16Array(
				pcmData.buffer,
				pcmData.byteOffset,
				pcmData.length / 2,
			);

			// Convert from Int16 to Float32 (normalize to -1.0 to 1.0)
			for (let i = 0; i < int16View.length; i++) {
				float32Data[i] = int16View[i] / 32768.0;
			}

			// Process the audio with VAD
			await this.vad.processAudio(float32Data);
		}
	}

	/**
	 * Clean up resources
	 */
	async flush(): Promise<void> {
		if (!this.isInitialized) return;

		try {
			// Process any remaining audio
			await this.vad.flush();
			// Clean up resources
			this.vad.destroy();
			this.isInitialized = false;
		} catch (error) {
			console.error("Error flushing audio stream:", error);
		}
	}
}

// Export a singleton instance
export const audioBufferManager = new AudioBufferManager();
