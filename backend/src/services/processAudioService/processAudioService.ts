import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import {
	ASSEMBLYAI_TRANSCRIPTION_ENABLED,
	DEEPGRAM_TRANSCRIPTION_ENABLED,
	SAVE_RECORDINGS_TO_GCS_ENABLED,
} from "@/constants/features";
import { deepgramLiveTranscriptionService } from "@/services/deepgramLiveTranscription";
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
	private isSpeechActive = false;

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
				this.isSpeechActive = true;

				// Start Deepgram live transcription when speech detected
				if (DEEPGRAM_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.startTranscription();
				}
			},
			onSpeechEnd: async (audio: Float32Array) => {
				console.log(`Speech ended, audio length: ${audio.length}`);
				this.isSpeechActive = false;

				// Clean up Deepgram transcription session
				if (DEEPGRAM_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.cleanup();
				}

				// Convert to WAV once
				const wavBuffer = convertFloat32ArrayToWavBuffer(audio);

				await Promise.all([
					ASSEMBLYAI_TRANSCRIPTION_ENABLED
						? createAndSaveTranscript(wavBuffer, this.speechStartTime)
						: Promise.resolve(),
					SAVE_RECORDINGS_TO_GCS_ENABLED
						? saveAudioToGCS(wavBuffer, this.speechStartTime)
						: Promise.resolve(),
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
				// If speech is active, send the packet to Deepgram
				if (this.isSpeechActive && DEEPGRAM_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.sendAudioPacket(pcmData);
				}

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
	async handleClientDisconnect(): Promise<void> {
		if (this.streamVAD) {
			await this.streamVAD.flush(); // Process any remaining audio
		}

		// Clean up Deepgram transcription
		if (DEEPGRAM_TRANSCRIPTION_ENABLED) {
			deepgramLiveTranscriptionService.cleanup();
		}
	}
}

// Export a singleton instance
export const processAudioService = new ProcessAudioService();
