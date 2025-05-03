import { CHANNELS, SAMPLE_RATE } from "@backend/src/constants/audioConstants";
import { DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED } from "@backend/src/constants/features";
import { deepgramLiveTranscriptionService } from "@backend/src/services/processAudioService/utils/deepgramLiveTranscriptionService";
import { processFinalizedSpeechChunk } from "@backend/src/services/processSpeechService/processFinalizedSpeechChunk";
import type { TypedSocket } from "@backend/src/types/socket-events";
import { convertPcmToFloat32Array } from "@backend/src/utils/audio/audioUtils";
import { generateReadableUUID } from "@backend/src/utils/generateReadableUUID";
import { OpusEncoder } from "@discordjs/opus";
import { RealTimeVAD } from "@ericedouard/vad-node-realtime";

/**
 * Audio processor for real-time voice activity detection
 */
export const createProcessAudioService = (socket: TypedSocket) => {
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
		console.log("[processAudioService] initializing VAD");
		streamVAD = await RealTimeVAD.new({
			model: "v5",
			// frameSamples: 1024,
			preSpeechPadFrames: 4,
			minSpeechFrames: 3,
			// redemptionFrames: 2,
			onSpeechStart: () => {
				console.log("[processAudioService] Speech started");
				speechStartTime = lastTimestamp;
				isSpeechActive = true;

				socket.emit("processingSpeechUpdate", {
					phase: "0-speech-detected",
				});

				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.startTranscription();
				}
			},
			onVADMisfire: () => {
				socket.emit("processingSpeechUpdate", {
					phase: "0.5-speech-misfire",
				});
				console.log("[processAudioService] VAD misfire");
			},

			onSpeechEnd: async (audio: Float32Array) => {
				console.log(
					`Speech ended, audio duration: ${audio.length / SAMPLE_RATE} seconds`,
				);
				const id = generateReadableUUID(speechStartTime);
				socket.emit("processingSpeechUpdate", {
					phase: "1-speech-stopped",
					id,
					startTime: speechStartTime,
				});

				isSpeechActive = false;

				if (DEEPGRAM_LIVE_TRANSCRIPTION_ENABLED) {
					deepgramLiveTranscriptionService.stopTranscription();
				}

				processFinalizedSpeechChunk({
					id,
					userId: socket.data.auth.user.id,
					socket,
					audio,
					speechStartTime,
				});
			},
		});

		streamVAD.start();
		console.log("[processAudioService] VAD initialized");
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
			console.error(
				"[processAudioService] Error processing audio packet:",
				error,
			);
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
