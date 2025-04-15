import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import {
	DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED,
	SAVE_RECORDINGS_TO_GCS_ENABLED,
} from "@/constants/features";
import { createAndSaveTranscript } from "@/services/processAudioService/utils/createAndSaveTranscript";
// import { audioBufferService } from "@/services/audioBufferService"; // Removed
import { deepgramLiveTranscriptionService } from "@/services/processAudioService/utils/deepgramLiveTranscriptionService";
import { saveAudioToGCS } from "@/services/processAudioService/utils/saveAudioToGcs";
import {
	convertFloat32ArrayToWavBuffer,
	convertPcmToFloat32Array,
} from "@/utils/audioUtils";
import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";

/**
 * Audio processor for real-time voice activity detection
 */
export const processAudioService = (() => {
	let streamVAD: RealTimeVAD | null = null;
	let speechStartTime = 0;
	let lastTimestamp = 0;
	let isSpeechActive = false;
	const opusEncoder = new OpusEncoder(SAMPLE_RATE, CHANNELS);

	// Initialize VAD
	initVAD();

	/**
	 * Initialize VAD
	 */
	async function initVAD(): Promise<void> {
		console.log("[VAD] initializing vad");
		streamVAD = await RealTimeVAD.new({
			onSpeechStart: () => {
				console.log("Speech started");
				speechStartTime = lastTimestamp;
				isSpeechActive = true;

				// Start Deepgram live transcription when speech detected
				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					// Start the connection (it handles buffering internally)
					deepgramLiveTranscriptionService.startTranscription();
				}
			},
			onSpeechEnd: async (audio: Float32Array) => {
				console.log(`Speech ended, audio length: ${audio.length}`);
				isSpeechActive = false;

				// Clean up Deepgram transcription session
				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.stopTranscription();
				}

				// Convert to WAV once
				const wavBuffer = convertFloat32ArrayToWavBuffer(audio);

				await Promise.all([
					createAndSaveTranscript(wavBuffer, speechStartTime),
					SAVE_RECORDINGS_TO_GCS_ENABLED
						? saveAudioToGCS(wavBuffer, speechStartTime)
						: Promise.resolve(),
				]);
			},
			preSpeechPadFrames: 10,
		});

		streamVAD.start();
		console.log("[VAD] vad initialized");
	}

	/**
	 * Process an audio packet
	 */
	const processAudioPacket = async (
		audioBuffer: ArrayBuffer,
		timestamp: number,
	): Promise<void> => {
		try {
			lastTimestamp = timestamp;

			// Convert ArrayBuffer to Buffer
			const packet = Buffer.from(audioBuffer);

			// Decode Opus packet to PCM
			const pcmData = opusEncoder.decode(packet);

			if (pcmData && pcmData.length > 0) {
				// If speech is active, send the packet to Deepgram
				// Deepgram service handles buffering if connection is not ready
				if (isSpeechActive && DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.sendAudioPacket(pcmData);
				}

				// Convert Buffer to Float32Array for VAD using utility function
				const float32Data = convertPcmToFloat32Array(pcmData);

				// Process the audio data with VAD
				if (streamVAD) {
					await streamVAD.processAudio(float32Data);
				} else {
					throw new Error("VAD not initialized");
				}
			}
		} catch (error) {
			console.error("Error processing audio packet:", error);
		}
	};

	/**
	 * Clean up resources
	 */
	const handleClientDisconnect = async (): Promise<void> => {
		if (streamVAD) {
			await streamVAD.flush(); // Process any remaining audio
		}

		// Reset flags
		isSpeechActive = false;

		// Clean up Deepgram transcription
		if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
			deepgramLiveTranscriptionService.stopTranscription();
		}
	};

	return {
		processAudioPacket,
		handleClientDisconnect,
	};
})();
