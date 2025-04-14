import { CHANNELS, SAMPLE_RATE } from "@/constants/audioConstants";
import { WaveFile } from "wavefile";

/**
 * Convert Float32Array to WAV file
 */
export const convertAudioToWav = (
	float32Audio: Float32Array,
	sampleRate = SAMPLE_RATE,
	channels = CHANNELS,
): WaveFile => {
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
};
