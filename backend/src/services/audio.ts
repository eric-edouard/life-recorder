import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";
import axios from "axios";

// Constants for audio processing
const SAMPLE_RATE = 16000; // 16kHz as specified
const CHANNELS = 1;
const OPUS_PACKET_DURATION_MS = 20; // Each Opus packet represents 20ms of audio

const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

// Get the recordings service URL from environment variables
const RECORDINGS_SERVICE_URL =
	process.env.RECORDINGS_SERVICE_URL ||
	"http://recordings-service.railway.internal:3000";

/**
 * Send audio data to the recordings service
 */
async function sendToRecordingsService(
	audioData: Float32Array,
	startTime: number,
): Promise<string> {
	try {
		// Convert Float32Array to regular array for JSON serialization
		const audioArray = Array.from(audioData);

		// Send to recordings service
		const response = await axios.post(
			`${RECORDINGS_SERVICE_URL}/save-recording`,
			{
				audioData: audioArray,
				startTime,
			},
		);

		if (response.data?.url) {
			return response.data.url;
		}

		throw new Error("Invalid response from recordings service");
	} catch (error) {
		console.error("Error sending audio to recordings service:", error);
		throw error;
	}
}

/**
 * Audio processor for real-time voice activity detection
 */
export class AudioProcessor {
	private streamVAD: RealTimeVAD | null = null;
	private speechStartTime = 0;
	private lastTimestamp = 0;

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
				this.speechStartTime = this.lastTimestamp;
			},
			onSpeechEnd: async (audio: Float32Array) => {
				console.log(`Speech ended, audio length: ${audio.length}`);
				await this.processSpeechAudio(audio);
			},
			preSpeechPadFrames: 10,
		});

		this.streamVAD.start();
	}

	/**
	 * Process speech audio and send to recordings service
	 */
	private async processSpeechAudio(audio: Float32Array): Promise<void> {
		try {
			const startTime = this.speechStartTime;

			// Send to recordings service
			const publicUrl = await sendToRecordingsService(audio, startTime);

			console.log(
				`Processed voice audio file and sent to recordings service: ${publicUrl}`,
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
			this.lastTimestamp = timestamp;

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
