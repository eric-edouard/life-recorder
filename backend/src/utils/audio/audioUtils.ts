import {
	CHANNELS,
	SAMPLE_RATE,
} from "@backend/src/constants/audioConstants.js";
import wavefile from "wavefile";
const { WaveFile } = wavefile;

/**
 * Converts a PCM buffer to a Float32Array for audio processing
 * @param pcmData Buffer containing 16-bit PCM audio data
 * @returns Float32Array with normalized audio samples in range [-1, 1]
 */
export function convertPcmToFloat32Array(pcmData: Buffer): Float32Array {
	const float32Data = new Float32Array(pcmData.length / 2);

	for (let i = 0; i < float32Data.length; i++) {
		// Extract 16-bit samples and normalize to [-1, 1]
		const sample = pcmData.readInt16LE(i * 2);
		float32Data[i] = sample / 32768.0;
	}

	return float32Data;
}

/**
 * Converts a Float32Array to a WAV buffer
 * @param audio Float32Array containing audio data
 * @returns Buffer containing WAV audio data
 */
export const convertFloat32ArrayToWavBuffer = (
	float32Audio: Float32Array,
): Buffer => {
	// Convert Float32Array to Int16Array for WAV file
	const int16Audio = new Int16Array(float32Audio.length);
	for (let i = 0; i < float32Audio.length; i++) {
		// Clip audio to [-1, 1] and scale to Int16 range
		const sample = Math.max(-1, Math.min(1, float32Audio[i]));
		int16Audio[i] = Math.round(sample * 32767);
	}

	// Create WAV file
	const wav = new WaveFile();
	wav.fromScratch(CHANNELS, SAMPLE_RATE, "16", Array.from(int16Audio));
	return Buffer.from(wav.toBuffer());
};
