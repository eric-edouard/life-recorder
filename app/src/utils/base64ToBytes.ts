/**
 * Utility functions for Bluetooth operations
 */

/**
 * Convert base64 string to byte array
 * @param base64 Base64 encoded string
 * @returns Uint8Array of bytes
 */
export const base64ToBytes = (base64: string): Uint8Array => {
	// React Native compatible base64 decoding
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	const lookup = new Uint8Array(256);
	for (let i = 0; i < chars.length; i++) {
		lookup[chars.charCodeAt(i)] = i;
	}

	const len = base64.length;
	let bufferLength = base64.length * 0.75;
	if (base64[len - 1] === "=") {
		bufferLength--;
		if (base64[len - 2] === "=") {
			bufferLength--;
		}
	}

	const bytes = new Uint8Array(bufferLength);

	let p = 0;
	let encoded1 = 0;
	let encoded2 = 0;
	let encoded3 = 0;
	let encoded4 = 0;

	for (let i = 0; i < len; i += 4) {
		encoded1 = lookup[base64.charCodeAt(i)] || 0;
		encoded2 = lookup[base64.charCodeAt(i + 1)] || 0;
		encoded3 = lookup[base64.charCodeAt(i + 2)] || 0;
		encoded4 = lookup[base64.charCodeAt(i + 3)] || 0;

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		if (encoded3 !== 64) {
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		}
		if (encoded4 !== 64) {
			bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
		}
	}

	return bytes;
};
