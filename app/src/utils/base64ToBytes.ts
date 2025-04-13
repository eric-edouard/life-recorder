/**
 * Utility functions for Bluetooth operations
 */
import { atob } from "react-native-quick-base64";

/**
 * Convert base64 string to byte array using react-native-quick-base64
 * @param base64 Base64 encoded string
 * @returns Array of bytes
 */
export const base64ToBytes = (base64: string): number[] => {
	try {
		// Convert base64 to byte array using react-native-quick-base64 (much faster)
		const bytes = atob(base64);
		return Array.from(bytes).map((c) => c.charCodeAt(0));
	} catch (error) {
		console.error("Error converting base64 to bytes:", error);
		return [];
	}
};
