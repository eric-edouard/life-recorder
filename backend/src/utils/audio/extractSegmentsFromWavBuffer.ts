import { SAMPLE_RATE } from "@backend/constants/audioConstants";
import { WaveFile } from "wavefile";

/**
 * Extracts and merges audio segments from a WAV buffer.
 * Skips extraction if total duration < 1.0s.
 *
 * @param wavBuffer Full WAV audio buffer
 * @param segments Array of time segments { start, end } in seconds
 * @returns New WAV buffer of merged segments, or null if too short
 */
export const extractSegmentsFromWavBuffer = (
	wavBuffer: Buffer,
	segments: { start: number; end: number }[],
): Buffer | null => {
	const wav = new WaveFile(wavBuffer);
	wav.toBitDepth("16");
	wav.toSampleRate(SAMPLE_RATE);
	const samplesPerSecond = SAMPLE_RATE;
	const channelCount = (wav.fmt as { numChannels: number }).numChannels;

	const fullSamples = wav.getSamples(false, Float64Array);

	// Total duration logic
	const totalDuration = segments.reduce((sum, s) => sum + (s.end - s.start), 0);

	if (totalDuration < 1.0) {
		return null;
	}

	const segmentSamples: number[] = [];

	for (const { start, end } of segments) {
		const startSample = Math.floor(start * samplesPerSecond) * channelCount;
		const endSample = Math.floor(end * samplesPerSecond) * channelCount;

		for (let i = startSample; i < endSample; i++) {
			if (i >= 0 && i < fullSamples.length) {
				segmentSamples.push(fullSamples[i]);
			}
		}
	}

	const merged = new WaveFile();
	merged.fromScratch(channelCount, samplesPerSecond, "16", segmentSamples);

	return Buffer.from(merged.toBuffer());
};
