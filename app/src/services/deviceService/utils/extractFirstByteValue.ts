import { base64ToBytes } from "@/src/utils/base64ToBytes";

export function extractFirstByteValue(
	base64Value: string | undefined | null,
): number | null {
	if (!base64Value) return null;
	const bytes = base64ToBytes(base64Value);
	if (bytes.length > 0) {
		return bytes[0];
	}
	return null;
}
