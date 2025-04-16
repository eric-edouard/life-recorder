import { fileSafeIso } from "@/utils/fileSafeIso";
import { randomBytes } from "node:crypto";

export function generateReadableUUID(
	startTimestamp: number,
	durationMs: number,
): string {
	const safe = fileSafeIso.dateToFileName(
		new Date(startTimestamp).toISOString(),
	);
	const rand = randomBytes(3).toString("hex");
	return `${safe}__${String(Math.round(durationMs / 1000)).padStart(4, "0")}s__${rand}`; // e.g. 2025-04-16T10-23-45-123Z__0006s__a3f9d2
}
