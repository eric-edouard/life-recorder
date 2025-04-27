export function fileNameToDate(fileSafeString: string): string {
	return fileSafeString
		.replace(/-(\d+)Z$/, ".$1Z") // revert hyphen before milliseconds back to dot
		.replace(/T(\d+)-(\d+)-(\d+)/g, "T$1:$2:$3"); // only replace hyphens in the time portion
}

interface ExtractedUUIDData {
	date: Date;
	durationSeconds?: number;
}

export function extractDataFromFileName(fileName: string): ExtractedUUIDData {
	// Parse the filename which has format: [date]__[duration]s__[random] or [date]__[random]
	const parts = fileName.split("__");

	// Extract the date part which is always the first segment
	const datePart = parts[0];
	const isoString = fileNameToDate(datePart);
	const date = new Date(isoString);

	// Check if duration is included (format would be [duration]s)
	let durationSeconds: number | undefined = undefined;
	if (parts.length === 3 && parts[1].endsWith("s")) {
		durationSeconds = Number.parseInt(parts[1].slice(0, -1), 10);
	}

	return {
		date,
		durationSeconds,
	};
}
