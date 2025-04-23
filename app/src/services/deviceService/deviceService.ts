import { bleManager } from "@/src/services/bleManager";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { extractFirstByteValue } from "@/src/services/deviceService/utils/extractFirstByteValue";
import { getDeviceCharacteristic } from "@/src/services/deviceService/utils/getDeviceCharacteric";
import { storage$ } from "@/src/services/storage";
import { defer } from "@/src/utils/defer";
import {
	type SignalStrength,
	rssiToSignalStrength,
} from "@/src/utils/rssiToSignalStrength";
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

	let batteryLevelInterval: number | null = null;
	let rssiInterval: number | null = null;
	const connectedDeviceId$ = observable<string | null>(null);
	const isConnected$ = observable(() => !!connectedDeviceId$.get());
	const batteryLevel$ = observable<number | null>(null);
	const rssi$ = observable<SignalStrength | null>(null);
	const isConnecting$ = observable(false);

	const setConnectedDevice = (device: Device | null) => {
		_connectedDevice = device;
		connectedDeviceId$.set(device?.id || null);
		if (device === null) {
			batteryLevelInterval && clearInterval(batteryLevelInterval);
			rssiInterval && clearInterval(rssiInterval);
			batteryLevel$.set(null);
			rssi$.set(null);
		}
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
			storage$.pairedDevice.set({
				id: device.id,
				name: device.name ?? "N/A",
				manufacturerData: device.manufacturerData,
				serviceUUIDs: device.serviceUUIDs,
				localName: device.localName,
			});

			device.onDisconnected(() => {
				setConnectedDevice(null);
			});

			monitorBatteryLevel();
			monitorRssi();

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

	const disconnectFromDevice = async () => {
		if (!_connectedDevice) {
			throw new Error("[deviceService] No device connected, cannot disconnect");
		}

		try {
			batteryLevelInterval && clearInterval(batteryLevelInterval);
			rssiInterval && clearInterval(rssiInterval);
			await _connectedDevice.cancelConnection();
			defer(() => setConnectedDevice(null));
		} catch (error) {
			console.error("[deviceService] Error disconnecting from device:", error);
		}
	};

	const unpairDevice = () => {
		storage$.pairedDevice.delete();
		return disconnectFromDevice();
	};

	const getAudioCodec = async (): Promise<BleAudioCodec | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}

		const codecCharacteristic = await getDeviceCharacteristic(
			_connectedDevice,
			OMI_SERVICE_UUID,
			AUDIO_CODEC_CHARACTERISTIC_UUID,
		);

		if (!codecCharacteristic) {
			throw new Error("Audio codec characteristic not found");
		}

		const codecId = extractFirstByteValue(
			(await codecCharacteristic.read()).value,
		);

		if (!codecId) {
			throw new Error("No codec ID found");
		}

		return CODEC_MAP[codecId];
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

	const monitorBatteryLevel = async () => {
		batteryLevelInterval = setInterval(async () => {
			const batteryLevel = await getBatteryLevel();
			batteryLevel$.set(batteryLevel);
		}, 30000); // 30 seconds
		// Initial fetch
		const batteryLevel = await getBatteryLevel();
		batteryLevel$.set(batteryLevel);
	};

	const getConnectedDeviceRssi = async (): Promise<number | null> => {
		if (_connectedDevice) {
			const device = await bleManager.readRSSIForDevice(_connectedDevice.id);
			return device.rssi;
		}
		return null;
	};

	const monitorRssi = async () => {
		rssiInterval = setInterval(async () => {
			const rssi = await getConnectedDeviceRssi();
			rssi$.set(rssi !== null ? rssiToSignalStrength(rssi) : null);
		}, 10000); // 10 seconds
		// Initial fetch
		const rssi = await getConnectedDeviceRssi();
		rssi$.set(rssi !== null ? rssiToSignalStrength(rssi) : null);
	};

	return {
		connectedDeviceId$,
		isConnecting$,
		isConnected$,
		batteryLevel$,
		rssi$,
		connectToDevice,
		getConnectedDevice: () => _connectedDevice,
		getConnectedDeviceRssi,
		disconnectFromDevice,
		unpairDevice,
		getAudioCodec,
		startAudioBytesListener,
		getBatteryLevel,
	};
})();
