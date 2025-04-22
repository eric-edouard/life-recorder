import { bleManager } from "@/src/services/bleManager";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { extractFirstByteValue } from "@/src/services/deviceService/utils/extractFirstByteValue";
import { getDeviceCharacteristic } from "@/src/services/deviceService/utils/getDeviceCharacteric";
import { storage$ } from "@/src/services/storage";
import { observable } from "@legendapp/state";
import { Platform } from "react-native";
import type { Device, Subscription } from "react-native-ble-plx";
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

export const deviceService = (() => {
	let _connectedDevice: Device | null = null;

	const connectedDeviceId$ = observable<string | null>(null);
	const isConnecting$ = observable(false);
	const isConnected$ = observable(() => !!connectedDeviceId$.get());

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

		// Set a 10-second timeout for connection
		const connectionTimeout = setTimeout(() => {
			if (isConnecting$.peek()) {
				isConnecting$.set(false);
				alert({
					title: "Connection failed",
					message: "Could not connect to device after 10 seconds",
				});
				console.log("Connection timed out after 10 seconds");
				return;
			}
		}, 10000);

		try {
			const _device = await bleManager.connectToDevice(
				deviceId,
				Platform.OS === "android" ? { requestMTU: 512 } : undefined,
			);
			const device = await _device.discoverAllServicesAndCharacteristics();

			clearTimeout(connectionTimeout);
			setConnectedDevice(device);
			storage$.pairedDeviceId.set(deviceId);

			device.onDisconnected(() => {
				setConnectedDevice(null);
			});

			isConnecting$.set(false);
			scanDevicesService.stopScan();
			return;
		} catch (error) {
			clearTimeout(connectionTimeout);
			console.error("Connection error:", error);
			isConnecting$.set(false);
			setConnectedDevice(null);

			alert({
				title: "Connection Error",
				message: String(error),
			});
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
		if (!_connectedDevice) {
			throw new Error("[deviceService] No device connected, cannot disconnect");
		}
		try {
			await _connectedDevice.cancelConnection();
			storage$.pairedDeviceId.delete();
			setConnectedDevice(null);
		} catch (error) {
			console.error("[deviceService] Error disconnecting from device:", error);
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
		const initialValue = await batteryLevelCharacteristic.read();
		if (!initialValue || !initialValue.value) {
			throw new Error("Battery level characteristic returned no value");
		}
		const value = extractFirstByteValue(initialValue.value);
		if (!value) {
			throw new Error(
				"Could not extract first byte value from battery level characteristic",
			);
		}
		onLevel(value);
		return batteryLevelCharacteristic.monitor((err, char) => {
			if (err || !char?.value) {
				return;
			}
			const value = extractFirstByteValue(char.value);
			if (!value) {
				return;
			}
			onLevel(value);
		});
	};

	return {
		connectedDeviceId$,
		isConnecting$,
		isConnected$,
		connectToDevice,
		getConnectedDevice: () => _connectedDevice,
		getConnectedDeviceRssi,
		disconnectFromDevice,
		getAudioCodec,
		startAudioBytesListener,
		getBatteryLevel,
		monitorBatteryLevel,
	};
})();
