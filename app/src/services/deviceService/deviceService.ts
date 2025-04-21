import { bleManager } from "@/src/services/bleManager";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { extractFirstByteValue } from "@/src/services/deviceService/utils/extractFirstByteValue";
import { getDeviceCharacteristic } from "@/src/services/deviceService/utils/getDeviceCharacteric";
import { storage } from "@/src/services/storage";
import { defer } from "@/src/utils/defer";
import { observable, when } from "@legendapp/state";
import { Alert, Platform } from "react-native";
import { type Device, State, type Subscription } from "react-native-ble-plx";
import { base64ToBytes } from "../../utils/base64ToBytes";
import {
	AUDIO_CODEC_CHARACTERISTIC_UUID,
	AUDIO_DATA_STREAM_CHARACTERISTIC_UUID,
	BATTERY_LEVEL_CHARACTERISTIC_UUID,
	BATTERY_SERVICE_UUID,
	CODEC_MAP,
	OMI_SERVICE_UUID,
} from "./constants";
import type { BleAudioCodec } from "./types";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export const scanAndAutoConnect = () => {
	const pairedDeviceId = storage.get("pairedDeviceId");

	// automatically scan for devices on startup if conditions are met
	when(
		() =>
			scanDevicesService.bluetoothState$.get() === State.PoweredOn &&
			scanDevicesService.permissionStatus$.get() === "granted",
		() => {
			defer(() => {
				scanDevicesService.scanDevices({
					autoConnectDeviceId: pairedDeviceId ?? undefined,
					onDeviceFound: async (device) => {
						if (device.id === pairedDeviceId) {
							scanDevicesService.stopScan();
							defer(() => deviceService.connectToDevice(device.id));
							return;
						}

						const foundCompatibleService =
							!!device.serviceUUIDs?.includes(OMI_SERVICE_UUID);

						if (foundCompatibleService) {
							scanDevicesService.stopScan();
							scanDevicesService.compatibleDeviceId$.set(device.id);
						}
					},
				});
			});
		},
	);
};

// autoConnect();

export const deviceService = (() => {
	let _connectedDevice: Device | null = null;

	const connectedDeviceId$ = observable<string | null>(null);
	const isConnecting$ = observable(false);

	const setConnectedDevice = (device: Device | null) => {
		_connectedDevice = device;
		connectedDeviceId$.set(device?.id || null);
	};

	const connectToDevice = async (deviceId: string) => {
		if (isConnecting$.peek()) {
			console.warn("Already connecting to a device");
			return;
		}

		if (_connectedDevice) {
			// If we're already connected to a device, disconnect from it
			await disconnectFromDevice();
		}

		isConnecting$.set(true);

		try {
			const device = await bleManager.connectToDevice(
				deviceId,
				Platform.OS === "android" ? { requestMTU: 512 } : undefined,
			);

			setConnectedDevice(device);
			storage.set("pairedDeviceId", deviceId);

			device.onDisconnected(() => {
				setConnectedDevice(null);
			});

			isConnecting$.set(false);
		} catch (error) {
			console.error("Connection error:", error);
			isConnecting$.set(false);
			setConnectedDevice(null);
			Alert.alert("Connection Error", String(error));
		}
	};

	const getConnectedDeviceRssi = async (): Promise<number | null> => {
		if (_connectedDevice) {
			const device = await bleManager.readRSSIForDevice(_connectedDevice.id);
			return device.rssi;
		}
		return null;
	};

	const disconnectFromDevice = async () => {
		storage.set("pairedDeviceId", null);
		if (_connectedDevice) {
			await _connectedDevice.cancelConnection();
			setConnectedDevice(null);
		}
	};

	const getAudioCodec = async (): Promise<BleAudioCodec | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}

		try {
			const codecCharacteristic = await getDeviceCharacteristic(
				_connectedDevice,
				OMI_SERVICE_UUID,
				AUDIO_CODEC_CHARACTERISTIC_UUID,
			);

			if (!codecCharacteristic) {
				console.error("Audio codec characteristic not found");
				return null;
			}

			const codecId = extractFirstByteValue(
				(await codecCharacteristic.read()).value,
			);

			if (!codecId) {
				console.error("No codec ID found");
				return null;
			}

			return CODEC_MAP[codecId];
		} catch (error) {
			console.error("Error getting audio codec:", error);
			return null;
		}
	};

	/**
	 * Start listening for audio bytes from the device
	 * @param onAudioBytesReceived Callback function that receives processed audio bytes
	 * @returns Promise that resolves with a subscription that can be used to stop listening
	 */
	const startAudioBytesListener = async (
		onAudioBytesReceived: (processedBytes: number[]) => void,
	): Promise<Subscription | undefined> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}

		try {
			const audioDataStreamCharacteristic = await getDeviceCharacteristic(
				_connectedDevice,
				OMI_SERVICE_UUID,
				AUDIO_DATA_STREAM_CHARACTERISTIC_UUID,
			);

			if (!audioDataStreamCharacteristic) {
				console.error("Audio data stream characteristic not found");
				return;
			}

			return audioDataStreamCharacteristic.monitor((error, characteristic) => {
				if (error) {
					if (error.message === "Operation was cancelled") {
						console.log("Audio data stream notification cancelled");
						return;
					}
					console.error("Audio data stream notification error:", error);
					return;
				}
				if (!characteristic?.value) {
					console.log("Received notification but no characteristic value");
					return;
				}
				const bytes = base64ToBytes(characteristic.value);
				// Remove the first 3 bytes (header) added by the Omi device
				onAudioBytesReceived(bytes.length > 3 ? bytes.slice(3) : bytes);
			});
		} catch (error) {
			console.error("Error starting audio bytes listener:", error);
			return;
		}
	};

	/**
	 * Get the current battery level from the device
	 * @returns Promise that resolves with the battery level percentage (0-100)
	 */
	const getBatteryLevel = async (): Promise<number | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		const batteryLevelCharacteristic = await getDeviceCharacteristic(
			_connectedDevice,
			BATTERY_SERVICE_UUID,
			BATTERY_LEVEL_CHARACTERISTIC_UUID,
		);

		if (!batteryLevelCharacteristic) return null;

		const base64Value = (await batteryLevelCharacteristic.read()).value;

		return extractFirstByteValue(base64Value);
	};

	/**
	 * Get the current battery level from the device
	 * @returns Promise that resolves with the battery level percentage (0-100)
	 */
	const monitorBatteryLevel = async (
		onLevel: (level: number) => void,
	): Promise<Subscription | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		const batteryLevelCharacteristic = await getDeviceCharacteristic(
			_connectedDevice,
			BATTERY_SERVICE_UUID,
			BATTERY_LEVEL_CHARACTERISTIC_UUID,
		);

		if (!batteryLevelCharacteristic) {
			throw new Error("Battery level characteristic not found");
		}

		return batteryLevelCharacteristic.monitor((err, char) => {
			if (err || !char?.value) return;
			const value = extractFirstByteValue(char.value);
			if (value) {
				onLevel(value);
			}
		});
	};

	return {
		connectedDeviceId$,
		isConnecting$,
		connectToDevice,
		getConnectedDevice: () => _connectedDevice,
		isConnected: () => _connectedDevice !== null,
		hasPairedDevice: () => !!storage.get("pairedDeviceId"),
		getConnectedDeviceRssi,
		disconnectFromDevice,
		getAudioCodec,
		startAudioBytesListener,
		getBatteryLevel,
		monitorBatteryLevel,
	};
})();
