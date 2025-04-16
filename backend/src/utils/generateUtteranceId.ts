import { generateReadableUUID } from "@/utils/generateReadableUUID";

export function generateUtteranceId(
	recordingStartTimestamp: number, // timestamp in ms
	utteranceStart: number, // in seconds
	utteranceEnd: number, // in seconds
): string {
	const utteranceStartTimestamp =
		recordingStartTimestamp + utteranceStart * 1000;
	const utteranceDurationMs = (utteranceEnd - utteranceStart) * 1000;

	return generateReadableUUID(utteranceStartTimestamp, utteranceDurationMs);
}
