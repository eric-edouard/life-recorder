export function isoToFileSafe(isoString: string): string {
	return isoString
		.replace(/:/g, "-") // replace colon (time separator)
		.replace(/\.(\d+)Z$/, "_$1Z"); // replace dot before milliseconds with underscore
}

export function fileSafeToIso(fileSafeString: string): string {
	return fileSafeString
		.replace(/-/g, ":") // revert dash back to colon
		.replace(/_(\d+)Z$/, ".$1Z"); // revert underscore back to dot before milliseconds
}
