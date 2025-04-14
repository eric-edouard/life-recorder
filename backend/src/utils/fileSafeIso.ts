/**
 * Convert an ISO date string to a filename-safe format
 */
export function dateToFileName(isoString: string): string {
	return isoString
		.replace(/:/g, "-") // replace colon (time separator)
		.replace(/\.(\d+)Z$/, "-$1Z"); // replace dot before milliseconds with hyphen
}

/**
 * Convert a filename-safe string back to an ISO date string
 */
export function fileNameToDate(fileSafeString: string): string {
	return fileSafeString
		.replace(/-(\d+)Z$/, ".$1Z") // revert hyphen before milliseconds back to dot
		.replace(/-/g, ":"); // revert other hyphens back to colon
}

export const fileSafeIso = {
	dateToFileName,
	fileNameToDate,
};
