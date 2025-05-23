import { randomBytes } from "node:crypto";
import { fileSafeIso } from "@backend/src/utils/fileSafeIso";

export function generateReadableUUID(
	startTimestamp?: number,
	durationMs?: number,
): string {
	const safe = fileSafeIso.dateToFileName(
		new Date(startTimestamp ?? Date.now()).toISOString(),
	);
	const durationStr = durationMs
		? String(Math.round(durationMs / 1000)).padStart(4, "0")
		: undefined;
	const rand = randomBytes(3).toString("hex");

	return durationStr ? `${safe}__${durationStr}s__${rand}` : `${safe}__${rand}`;
}
