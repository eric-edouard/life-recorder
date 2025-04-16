export type SignStrength = "excellent" | "good" | "moderate" | "poor";

export const rssiToSignStrength = (rssi: number): SignStrength => {
	if (rssi >= -50) return "excellent";
	if (rssi >= -60) return "good";
	if (rssi >= -70) return "moderate";
	return "poor";
};
