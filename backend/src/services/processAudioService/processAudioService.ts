import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED } from "@backend/src/constants/features";
import { deepgramLiveTranscriptionService } from "@backend/src/services/processAudioService/utils/deepgramLiveTranscriptionService";
import { processFinalizedSpeechChunk } from "@backend/src/services/processSpeechService/processFinalizedSpeechChunk";
import { socketService } from "@backend/src/services/socketService";
import { convertPcmToFloat32Array } from "@backend/src/utils/audio/audioUtils";
import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";

/**
 * Audio processor for real-time voice activity detection
 */
export const createProcessAudioService = (userId: string) => {
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
			model: "v5",
			onSpeechStart: () => {
				console.log("Speech started");
				speechStartTime = lastTimestamp;
				isSpeechActive = true;

				socketService.socket?.emit("speechStarted");

				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.startTranscription();
				}
			},
			onVADMisfire: () => {
				socketService.socket?.emit("speechStopped");
				console.log("VAD misfire");
			},

			onSpeechEnd: async (audio: Float32Array) => {
				console.log(
					`Speech ended, audio duration: ${audio.length / SAMPLE_RATE} seconds`,
				);
				isSpeechActive = false;
				socketService.socket?.emit("speechStopped");

				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.stopTranscription();
				}

				socketService.socket?.emit(
					"processingAudioUpdate",
					"1-converting-to-wav",
				);
				// TODO: get user id from socket
				processFinalizedSpeechChunk(userId, audio, speechStartTime);
			},
			preSpeechPadFrames: 4,
			minSpeechFrames: 3,
			redemptionFrames: 8,
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
};
