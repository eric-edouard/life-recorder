export type SignalStrength = "excellent" | "good" | "moderate" | "poor";

export const rssiToSignalStrength = (rssi: number): SignalStrength => {
	if (rssi >= -50) return "excellent";
	if (rssi >= -60) return "good";
	if (rssi >= -70) return "moderate";
	return "poor";
};
