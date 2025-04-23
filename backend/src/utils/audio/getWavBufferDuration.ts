import { CHANNELS } from "@backend/constants/audioConstants";

import { SAMPLE_RATE } from "@backend/constants/audioConstants";

export const getWavBufferDuration = (wavBuffer: Buffer): number => {
	// Get audio duration from metadata (passed from parent function)
	// We have to estimate the duration from the buffer size
	// WAV header is 44 bytes, and the rest is audio data
	// Each sample is 2 bytes (16-bit) per channel
	const audioDataSize = wavBuffer.length - 44;
	const bytesPerSample = 2 * CHANNELS;
	const samples = audioDataSize / bytesPerSample;
	const durationMs = Math.round((samples / SAMPLE_RATE) * 1000);
	return durationMs;
};
