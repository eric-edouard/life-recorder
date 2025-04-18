/**
 * BLE UUIDs and constants for Omi device communication
 */

// Service and characteristic UUIDs
export const OMI_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
export const AUDIO_CODEC_CHARACTERISTIC_UUID =
	"19b10002-e8f2-537e-4f6c-d104768a1214";
export const AUDIO_DATA_STREAM_CHARACTERISTIC_UUID =
	"19b10001-e8f2-537e-4f6c-d104768a1214";

// Battery service UUIDs
export const BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
export const BATTERY_LEVEL_CHARACTERISTIC_UUID =
	"00002a19-0000-1000-8000-00805f9b34fb";

// Codec IDs and their meanings
export const CODEC_ID = {
	PCM16: 0,
	PCM8: 1,
	OPUS: 20,
};
