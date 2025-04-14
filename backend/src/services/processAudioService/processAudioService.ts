import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import { createAndSaveTranscript } from "@/services/processAudioService/createAndSaveTranscript";
import { saveAudioToGCS } from "@/services/processAudioService/saveAudioToGcs";
import {
	convertFloat32ArrayToWavBuffer,
	convertPcmToFloat32Array,
} from "@/utils/audioUtils";
import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";

const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

/**
 * Audio processor for real-time voice activity detection
 */
export class ProcessAudioService {
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
		console.log("[VAD] initializing vad");
		this.streamVAD = await RealTimeVAD.new({
			onSpeechStart: () => {
				console.log("Speech started");
				this.speechStartTime = this.lastTimestamp;
			},
			onSpeechEnd: async (audio: Float32Array) => {
				console.log(`Speech ended, audio length: ${audio.length}`);

				// Convert to WAV once
				const wavBuffer = convertFloat32ArrayToWavBuffer(audio);

				await Promise.all([
					createAndSaveTranscript(wavBuffer, this.speechStartTime),
					saveAudioToGCS(wavBuffer, this.speechStartTime),
				]);
			},
			preSpeechPadFrames: 10,
		});

		this.streamVAD.start();
		console.log("[VAD] vad initialized");
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
				// Convert Buffer to Float32Array for VAD using utility function
				const float32Data = convertPcmToFloat32Array(pcmData);

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
export const processAudioService = new ProcessAudioService();
