/**
 * Merge speech segments that are close to each other
 * @param segments - Array of speech segments with start and end times
 * @returns Merged segments
 */
export const mergeSpeechSegments = (
	segments: { start: number; end: number }[],
) => {
	const sorted = segments.sort((a, b) => a.start - b.start);
	const merged = [sorted[0]];

	for (let i = 1; i < sorted.length; i++) {
		const last = merged[merged.length - 1];
		const curr = sorted[i];

		if (curr.start <= last.end + 1) {
			// Allow up to 1s gap
			last.end = Math.max(last.end, curr.end);
		} else {
			merged.push(curr);
		}
	}

	return merged;
};
