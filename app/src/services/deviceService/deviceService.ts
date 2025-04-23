import { bleManager } from "@app/services/bleManager";
import { scanDevicesService } from "@app/services/deviceService/scanDevicesService";
import { getCharacteristicValue } from "@app/services/deviceService/utils/getCharacteristicValue";
import { getDeviceCharacteristic } from "@app/services/deviceService/utils/getDeviceCharacteric";
import { monitorCharacteristic } from "@app/services/deviceService/utils/monitorCharacteristic";
import { storage$ } from "@app/services/storage";
import { alert } from "@app/utils/alert";
import { defer } from "@app/utils/defer";
import {
	type SignalStrength,
	rssiToSignalStrength,
} from "@app/utils/rssiToSignalStrength";
import { observable, observe } from "@legendapp/state";
import { Platform } from "react-native";
import type { Device, Subscription } from "react-native-ble-plx";
import { base64ToBytes } from "../../utils/base64ToBytes";
import {
	AUDIO_CODEC_CHARACTERISTIC_UUID,
	AUDIO_DATA_STREAM_CHARACTERISTIC_UUID,
	BATTERY_LEVEL_CHARACTERISTIC_UUID,
	BATTERY_SERVICE_UUID,
	BUTTON_CHARACTERISTIC_UUID,
	BUTTON_SERVICE_UUID,
	BUTTON_STATE,
	type ButtonState,
	CODEC_MAP,
	OMI_SERVICE_UUID,
} from "./constants";
import type { BleAudioCodec } from "./types";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export const deviceService = (() => {
	let _connectedDevice: Device | null = null;

	let batteryLevelSubscription: Subscription | null = null;
	let rssiInterval: NodeJS.Timeout | null = null;
	let buttonStateSubscription: Subscription | null = null;
	const connectedDeviceId$ = observable<string | null>(null);
	const isConnected$ = observable(() => !!connectedDeviceId$.get());
	const batteryLevel$ = observable<number | null>(null);
	const rssi$ = observable<SignalStrength | null>(null);
	const buttonState$ = observable<ButtonState | null>(null);
	const isConnecting$ = observable(false);

	const setConnectedDevice = (device: Device | null) => {
		_connectedDevice = device;
		connectedDeviceId$.set(device?.id || null);
		if (device === null) {
			batteryLevelSubscription?.remove();
			buttonStateSubscription?.remove();
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
			monitorButtonState();
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
			buttonStateSubscription?.remove();
			batteryLevelSubscription?.remove();
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
		const value = await getCharacteristicValue(
			_connectedDevice,
			OMI_SERVICE_UUID,
			AUDIO_CODEC_CHARACTERISTIC_UUID,
		);
		if (!value) {
			throw new Error("No audio codec value found");
		}
		return CODEC_MAP[value];
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

		const audioDataStreamCharacteristic = await getDeviceCharacteristic(
			_connectedDevice,
			OMI_SERVICE_UUID,
			AUDIO_DATA_STREAM_CHARACTERISTIC_UUID,
		);

		if (!audioDataStreamCharacteristic) {
			throw new Error("[deviceService] No audioDataStreamCharacteristic");
		}

		return audioDataStreamCharacteristic.monitor((error, characteristic) => {
			if (error) {
				if (error.message === "Operation was cancelled") {
					console.log("Audio data stream notification cancelled");
					return;
				}
				throw new Error("[deviceService] Audio data stream notification error");
			}
			if (!characteristic?.value) {
				throw new Error(
					"[deviceService] Received notification but no characteristic value",
				);
			}
			const bytes = base64ToBytes(characteristic.value);
			// Remove the first 3 bytes (header) added by the Omi device
			onAudioBytesReceived(bytes.length > 3 ? bytes.slice(3) : bytes);
		});
	};

	const getBatteryLevel = async (): Promise<number> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		return getCharacteristicValue(
			_connectedDevice,
			BATTERY_SERVICE_UUID,
			BATTERY_LEVEL_CHARACTERISTIC_UUID,
		);
	};

	const monitorBatteryLevel = async () => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		batteryLevelSubscription = await monitorCharacteristic(
			_connectedDevice,
			BATTERY_SERVICE_UUID,
			BATTERY_LEVEL_CHARACTERISTIC_UUID,
			(value) => batteryLevel$.set(value),
		);
	};

	const getConnectedDeviceRssi = async (): Promise<number | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		const device = await bleManager.readRSSIForDevice(_connectedDevice.id);
		return device.rssi;
	};

	const monitorRssi = async () => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		rssiInterval = setInterval(async () => {
			const rssi = await getConnectedDeviceRssi();
			rssi$.set(rssi !== null ? rssiToSignalStrength(rssi) : null);
		}, 10000); // 10 seconds
		// Initial fetch
		const rssi = await getConnectedDeviceRssi();
		rssi$.set(rssi !== null ? rssiToSignalStrength(rssi) : null);
	};

	const getButtonState = async (): Promise<ButtonState> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		return BUTTON_STATE[
			(await getCharacteristicValue(
				_connectedDevice,
				BUTTON_SERVICE_UUID,
				BUTTON_CHARACTERISTIC_UUID,
			)) as keyof typeof BUTTON_STATE
		];
	};

	const monitorButtonState = async () => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}
		buttonStateSubscription = await monitorCharacteristic(
			_connectedDevice,
			BUTTON_SERVICE_UUID,
			BUTTON_CHARACTERISTIC_UUID,
			(value) =>
				buttonState$.set(BUTTON_STATE[value as keyof typeof BUTTON_STATE]),
		);
	};

	return {
		connectedDeviceId$,
		isConnecting$,
		isConnected$,
		batteryLevel$,
		rssi$,
		buttonState$,
		connectToDevice,
		getConnectedDevice: () => _connectedDevice,
		getConnectedDeviceRssi,
		disconnectFromDevice,
		unpairDevice,
		getAudioCodec,
		startAudioBytesListener,
		getBatteryLevel,
		getButtonState,
	};
})();

observe(deviceService.buttonState$, (buttonState) => {
	console.log(">>> buttonState", buttonState.value);
});
