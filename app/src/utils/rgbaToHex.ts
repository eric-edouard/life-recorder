export function rgbaToHex(rgba: string): string {
	const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d\.]+)?\)/);
	if (!match) throw new Error("Invalid RGBA format");
	const r = Number.parseInt(match[1], 10);
	const g = Number.parseInt(match[2], 10);
	const b = Number.parseInt(match[3], 10);
	// Ignore alpha for hex output
	return `#${[r, g, b]
		.map((x) => {
			const hex = x.toString(16).toUpperCase();
			return hex.length === 1 ? `0${hex}` : hex;
		})
		.join("")}`;
}
