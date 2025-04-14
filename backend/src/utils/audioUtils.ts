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
