import { fileSafeIso } from "@/utils/fileSafeIso";
import { OpusEncoder } from "@discordjs/opus";
import { NonRealTimeVAD } from "@ricky0123/vad-node";
import { WaveFile } from "wavefile";
import { gcsBucket } from "./gcs";

// Constants for audio processing
const SAMPLE_RATE = 16000; // 16kHz as specified
const CHANNELS = 1;
const OPUS_PACKET_DURATION_MS = 20; // Each Opus packet represents 20ms of audio
const BUFFER_DURATION_MS = 3000; // 3 seconds of audio before processing
const MAX_PACKETS = Math.ceil(BUFFER_DURATION_MS / OPUS_PACKET_DURATION_MS); // 150 packets for 3 seconds

const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

/**
 * Generate a filename based on timestamp, duration, and voice detection
 */
const createFilename = (
	isoDate: string,
	durationMs: number,
	hasVoice: boolean,
): string => {
	const fileSafeIsoDate = fileSafeIso.dateToFileName(isoDate);
	if (hasVoice) {
		return `${fileSafeIsoDate}__${durationMs}__VOICE_DETECTED.wav`;
	}
	return `${fileSafeIsoDate}__${durationMs}.wav`;
};

/**
 * Convert multiple Opus packets to a single WAV file
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
 * Detect voice activity in audio data
 */
async function detectVoice(wavFile: WaveFile): Promise<{
	hasVoice: boolean;
	speechSegments: Array<{ start: number; end: number }>;
}> {
	try {
		// Get samples and handle proper type conversion
		const rawSamples = wavFile.getSamples() as unknown as Int16Array;
		const audioSamples = new Float32Array(rawSamples.length);

		// Convert from Int16 to Float32 (normalize to -1.0 to 1.0)
		for (let i = 0; i < rawSamples.length; i++) {
			audioSamples[i] = rawSamples[i] / 32768.0;
		}

		// Run voice activity detection
		const vad = await NonRealTimeVAD.new();
		const sampleRate = (wavFile.fmt as { sampleRate: number }).sampleRate;

		// Check if there are any speech segments
		const segments = vad.run(audioSamples, sampleRate);

		// Collect all speech segments
		const speechSegments: Array<{ start: number; end: number }> = [];
		for await (const { start, end } of segments) {
			speechSegments.push({ start, end });
		}

		// Determine if voice was detected based on having any segments
		const hasVoice = speechSegments.length > 0;

		return { hasVoice, speechSegments };
	} catch (error) {
		console.error("Error during voice detection:", error);
		return { hasVoice: false, speechSegments: [] };
	}
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
 * Audio buffer manager to collect packets by client ID
 */
export class AudioBufferManager {
	private clientBuffers: Map<
		string,
		{
			packets: Buffer[];
			startTimestamp: number;
		}
	> = new Map();

	/**
	 * Add an audio packet to the client's buffer
	 */
	async addPacket(
		clientId: string,
		audioBuffer: ArrayBuffer,
		timestamp: number,
	): Promise<void> {
		// Convert ArrayBuffer to Buffer
		const packet = Buffer.from(audioBuffer);

		// Get or create buffer for this client
		if (!this.clientBuffers.has(clientId)) {
			this.clientBuffers.set(clientId, {
				packets: [],
				startTimestamp: timestamp,
			});
		}

		const clientBuffer = this.clientBuffers.get(clientId)!;
		clientBuffer.packets.push(packet);

		// Process buffer if we've reached 3 seconds of audio
		if (clientBuffer.packets.length >= MAX_PACKETS) {
			// Atomically replace the buffer before processing to avoid losing packets
			const buffersToProcess = clientBuffer.packets;
			const startTime = clientBuffer.startTimestamp;

			// Create a new buffer for this client with an updated timestamp
			this.clientBuffers.set(clientId, {
				packets: [],
				startTimestamp: Date.now(),
			});

			// Process the previous buffer's contents
			await this.processBufferContents(clientId, buffersToProcess, startTime);
		}
	}

	/**
	 * Process a client's buffer when it reaches 3 seconds
	 */
	private async processBufferContents(
		clientId: string,
		packets: Buffer[],
		startTimestamp: number,
	): Promise<void> {
		if (packets.length === 0) return;

		try {
			// Calculate actual duration
			const durationMs = packets.length * OPUS_PACKET_DURATION_MS;

			// Convert to WAV
			const wavFile = opusPacketsToWav(packets);

			// Detect voice
			const { hasVoice, speechSegments } = await detectVoice(wavFile);

			// Create timestamp for filename
			const timestampISO = new Date(startTimestamp).toISOString();

			// Generate filename
			const filename = createFilename(timestampISO, durationMs, hasVoice);

			// Upload to GCS with metadata
			await uploadToGCS(Buffer.from(wavFile.toBuffer()), filename, {
				"has-voice": hasVoice.toString(),
				duration: durationMs.toString(),
				segments: JSON.stringify(speechSegments),
				timestamp: startTimestamp.toString(),
			});

			console.log(
				`Processed and uploaded ${durationMs}ms audio file: ${filename}`,
			);
		} catch (error) {
			console.error(
				`Error processing audio buffer for client ${clientId}:`,
				error,
			);
		}
	}

	/**
	 * Force process any remaining audio for a client (e.g., on disconnect)
	 */
	async flushClientBuffer(clientId: string): Promise<void> {
		const clientBuffer = this.clientBuffers.get(clientId);
		if (!clientBuffer || clientBuffer.packets.length === 0) return;

		// Only process if we have enough packets to make it worthwhile
		if (clientBuffer.packets.length >= 10) {
			// At least 200ms of audio
			const buffersToProcess = clientBuffer.packets;
			const startTime = clientBuffer.startTimestamp;

			// Clear the buffer immediately to avoid any race conditions
			this.clientBuffers.delete(clientId);

			// Process the remaining audio
			await this.processBufferContents(clientId, buffersToProcess, startTime);
		} else {
			// Clear buffer without processing if too small
			this.clientBuffers.delete(clientId);
		}
	}
}

// Export a singleton instance
export const audioBufferManager = new AudioBufferManager();
