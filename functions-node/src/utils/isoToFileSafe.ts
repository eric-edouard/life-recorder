export function isoToFileSafe(isoString: string): string {
	return isoString
		.replace(/:/g, "-") // replace colon (time separator)
		.replace(/\.(\d+)Z$/, "-$1Z"); // replace dot before milliseconds with hyphen
}

export function fileSafeToIso(fileSafeString: string): string {
	return fileSafeString
		.replace(/-(\d+)Z$/, ".$1Z") // revert hyphen before milliseconds back to dot
		.replace(/-/g, ":"); // revert other hyphens back to colon
}
