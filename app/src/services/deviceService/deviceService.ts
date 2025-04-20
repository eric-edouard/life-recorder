import { requestBluetoothPermissions } from "@/src/services/deviceService/requestBluetoothPermissions";
import { storage } from "@/src/services/storage";
import { observable, when } from "@legendapp/state";
import { Alert, Linking, Platform } from "react-native";
import {
	BleManager,
	type Device,
	State,
	type Subscription,
} from "react-native-ble-plx";
import { base64ToBytes } from "../../utils/base64ToBytes";
import {
	AUDIO_CODEC_CHARACTERISTIC_UUID,
	AUDIO_DATA_STREAM_CHARACTERISTIC_UUID,
	BATTERY_LEVEL_CHARACTERISTIC_UUID,
	BATTERY_SERVICE_UUID,
	CODEC_ID,
	OMI_SERVICE_UUID,
} from "./constants";
import { BleAudioCodec, type BluetoothDevice } from "./types";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export const deviceService = (() => {
	const _bleManager = new BleManager();
	let _bleSubscription: Subscription;
	let _stopScanCallback: (() => void) | null = null;
	let _connectedDevice: Device | null = null;

	const bluetoothState$ = observable(State.Unknown);
	const permissionGranted$ = observable(false);
	const scanning$ = observable(false);
	const devices$ = observable<BluetoothDevice[]>([]);
	const connectedDeviceId$ = observable<string | null>(null);
	const isConnecting$ = observable(false);

	const initialize = () => {
		_bleSubscription = _bleManager.onStateChange((state) => {
			bluetoothState$.set(state);
			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				requestBluetoothPermission();
			}
		}, true);

		when(
			() =>
				permissionGranted$.get() === true &&
				bluetoothState$.get() === State.PoweredOn,
			() => setTimeout(() => startScan(), 0),
		);
	};

	initialize();

	const setConnectedDevice = (device: Device | null) => {
		_connectedDevice = device;
		connectedDeviceId$.set(device?.id || null);
	};

	const requestBluetoothPermission = () =>
		requestBluetoothPermissions(_bleManager, (granted) =>
			permissionGranted$.set(granted),
		);

	const startScan = () => {
		if (bluetoothState$.peek() !== State.PoweredOn) {
			Alert.alert(
				"Bluetooth is Off",
				"Please turn on Bluetooth to scan for devices.",
				[
					{ text: "Cancel", style: "cancel" },
					{ text: "Open Settings", onPress: () => Linking.openSettings() },
				],
			);
			return;
		}

		if (!permissionGranted$.peek()) {
			requestBluetoothPermission();
			return;
		}

		// Get previously connected device ID
		const savedDeviceId = storage.get("connectedDeviceId");

		scanning$.set(true);
		// Start the BLE scan
		_bleManager.startDeviceScan(
			savedDeviceId ? [savedDeviceId] : null,
			{},
			(error, foundDevice) => {
				if (error) {
					console.error("Scan error:", error);
					return;
				}

				if (foundDevice?.name) {
					const device: BluetoothDevice = {
						id: foundDevice.id,
						name: foundDevice.name,
						rssi: foundDevice.rssi || 0,
						isConnectable: foundDevice.isConnectable || false,
						overflowServiceUUIDs: foundDevice.overflowServiceUUIDs || [],
						rawScanRecord: foundDevice.rawScanRecord,
						manufacturerData: foundDevice.manufacturerData,
						serviceData: foundDevice.serviceData,
						serviceUUIDs: foundDevice.serviceUUIDs,
						localName: foundDevice.localName,
						txPowerLevel: foundDevice.txPowerLevel,
						solicitedServiceUUIDs: foundDevice.solicitedServiceUUIDs,
					};

					// Add to devices list if not already there
					devices$.set((prevDevices) => {
						// Check if device already exists
						if (prevDevices.some((d) => d.id === device.id)) {
							return prevDevices;
						}

						// Auto-connect to previously connected device
						if (savedDeviceId && device.id === savedDeviceId) {
							connectToDevice(device.id);
						}

						return [...prevDevices, device];
					});
				}
			},
		);

		if (savedDeviceId) {
			// If we have a saved device ID, we contiuously connect to it
			return;
		}

		// Auto-stop after 30 seconds
		const timeoutId = setTimeout(() => {
			stopScan();
		}, 30000);

		_stopScanCallback = () => {
			clearTimeout(timeoutId);
			_bleManager.stopDeviceScan();
		};
	};

	const stopScan = () => {
		scanning$.set(false);
		if (_stopScanCallback) {
			_stopScanCallback();
			_stopScanCallback = null;
		}
	};

	const connectToDevice = async (deviceId: string) => {
		if (isConnecting$.peek()) {
			console.log("Already connecting to a device");
			return false;
		}

		// First check if we're already connected to a device
		if (_connectedDevice) {
			// Disconnect from the current device first
			await disconnectFromDevice();
		}

		isConnecting$.set(true);

		try {
			// Connect to the device with MTU request for Android
			const connectionOptions =
				Platform.OS === "android" ? { requestMTU: 512 } : undefined;

			const device = await _bleManager.connectToDevice(
				deviceId,
				connectionOptions,
			);

			if (Platform.OS === "android") {
				console.log("Requested MTU size of 512 during connection");
			}

			setConnectedDevice(device);

			// Store connected device ID
			storage.set("connectedDeviceId", deviceId);

			// Set up disconnection listener
			device.onDisconnected(() => {
				setConnectedDevice(null);
			});

			// Auto-stop scanning when connected successfully
			if (scanning$.peek()) {
				stopScan();
			}

			isConnecting$.set(false);
			return true;
		} catch (error) {
			console.error("Connection error:", error);
			isConnecting$.set(false);
			setConnectedDevice(null);
			Alert.alert("Connection Error", String(error));
			return false;
		}
	};

	const getConnectedDeviceRssi = async () => {
		if (_connectedDevice) {
			const device = await _bleManager.readRSSIForDevice(_connectedDevice.id);
			return device.rssi;
		}
		return null;
	};

	const disconnectFromDevice = async () => {
		storage.set("connectedDeviceId", null);
		if (_connectedDevice) {
			await _connectedDevice.cancelConnection();
			setConnectedDevice(null);
		}
	};

	const getAudioCodec = async (): Promise<BleAudioCodec> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}

		try {
			// Get the Omi service
			const services = await _connectedDevice.services();
			const omiService = services.find(
				(service) =>
					service.uuid.toLowerCase() === OMI_SERVICE_UUID.toLowerCase(),
			);

			if (!omiService) {
				console.error("Omi service not found");
				return BleAudioCodec.PCM8; // Default codec
			}

			// Get the audio codec characteristic
			const characteristics = await omiService.characteristics();
			const codecCharacteristic = characteristics.find(
				(char) =>
					char.uuid.toLowerCase() ===
					AUDIO_CODEC_CHARACTERISTIC_UUID.toLowerCase(),
			);

			if (!codecCharacteristic) {
				console.error("Audio codec characteristic not found");
				return BleAudioCodec.PCM8; // Default codec
			}

			// Default codec is PCM8
			let codecId = 1;
			let codec = BleAudioCodec.PCM8;

			// Read the codec value
			const codecValue = await codecCharacteristic.read();
			const base64Value = codecValue.value || "";

			if (base64Value) {
				// Decode base64 to get the first byte
				const bytes = base64ToBytes(base64Value);
				if (bytes.length > 0) {
					codecId = bytes[0] || 1; // Default to 1 if undefined
				}
			}

			// Map codec ID to enum
			switch (codecId) {
				case CODEC_ID.PCM16:
					codec = BleAudioCodec.PCM16;
					break;
				case CODEC_ID.PCM8:
					codec = BleAudioCodec.PCM8;
					break;
				case CODEC_ID.OPUS:
					codec = BleAudioCodec.OPUS;
					break;
				default:
					console.warn(`Unknown codec id: ${codecId}`);
					break;
			}

			return codec;
		} catch (error) {
			console.error("Error getting audio codec:", error);
			return BleAudioCodec.PCM8; // Default codec on error
		}
	};

	/**
	 * Start listening for audio bytes from the device
	 * @param onAudioBytesReceived Callback function that receives processed audio bytes
	 * @returns Promise that resolves with a subscription that can be used to stop listening
	 */
	const startAudioBytesListener = async (
		onAudioBytesReceived: (processedBytes: number[]) => void,
	): Promise<Subscription | null> => {
		if (!_connectedDevice) {
			throw new Error("Device not connected");
		}

		try {
			// Get the Omi service
			const services = await _connectedDevice.services();
			const omiService = services?.find(
				(service) =>
					service.uuid.toLowerCase() === OMI_SERVICE_UUID.toLowerCase(),
			);

			if (!omiService) {
				console.error("Omi service not found");
				return null;
			}

			// Get the audio data stream characteristic
			const characteristics = await omiService.characteristics();
			const audioDataStreamCharacteristic = characteristics.find(
				(char) =>
					char.uuid.toLowerCase() ===
					AUDIO_DATA_STREAM_CHARACTERISTIC_UUID.toLowerCase(),
			);

			if (!audioDataStreamCharacteristic) {
				console.error("Audio data stream characteristic not found");
				return null;
			}

			try {
				console.log(
					"Setting up audio bytes notification for characteristic:",
					audioDataStreamCharacteristic.uuid,
				);

				// First try to read the characteristic to ensure it's accessible
				try {
					const initialValue = await audioDataStreamCharacteristic.read();
					console.log(
						"Initial audio characteristic value length:",
						initialValue?.value?.length || 0,
					);
				} catch (readError) {
					console.log(
						"Could not read initial value, continuing anyway:",
						readError,
					);
				}

				// Set up the monitor - this automatically enables notifications
				const subscription = audioDataStreamCharacteristic.monitor(
					(error, characteristic) => {
						if (error) {
							if (error.message === "Operation was cancelled") {
								console.log("Audio data stream notification cancelled");
								return;
							}
							console.error("Audio data stream notification error:", error);
							return;
						}

						if (characteristic?.value) {
							const base64Value = characteristic.value;
							// Convert base64 to bytes using optimized function
							const bytes = base64ToBytes(base64Value);
							// Remove the first 3 bytes (header) added by the Omi device
							const processedBytes = bytes.length > 3 ? bytes.slice(3) : bytes;
							onAudioBytesReceived(processedBytes);
						} else {
							console.log("Received notification but no value");
						}
					},
				);

				console.log("Subscribed to audio bytes stream from Omi Device");
				return subscription;
			} catch (e) {
				console.error("Error subscribing to audio data stream:", e);
				return null;
			}
		} catch (error) {
			console.error("Error starting audio bytes listener:", error);
			return null;
		}
	};

	/**
	 * Stop listening for audio bytes
	 * @param subscription The subscription returned by startAudioBytesListener
	 */
	const stopAudioBytesListener = async (
		subscription: Subscription,
	): Promise<void> => {
		if (subscription) {
			subscription.remove();
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

		try {
			// Get the Battery service
			const services = await _connectedDevice.services();
			const batteryService = services?.find(
				(service) =>
					service.uuid.toLowerCase() === BATTERY_SERVICE_UUID.toLowerCase(),
			);

			if (!batteryService) {
				console.error("Battery service not found");
				return -1;
			}

			// Get the battery level characteristic
			const characteristics = await batteryService.characteristics();
			const batteryLevelCharacteristic = characteristics.find(
				(char) =>
					char.uuid.toLowerCase() ===
					BATTERY_LEVEL_CHARACTERISTIC_UUID.toLowerCase(),
			);

			if (!batteryLevelCharacteristic) {
				console.error("Battery level characteristic not found");
				return -1;
			}

			// Read the battery level value
			const batteryValue = await batteryLevelCharacteristic.read();
			const base64Value = batteryValue.value || "";

			if (base64Value) {
				// Decode base64 to get the first byte
				const bytes = base64ToBytes(base64Value);
				if (bytes.length > 0) {
					return bytes[0] || null; // Battery level is a percentage (0-100), use -1 if undefined
				}
			}

			return null;
		} catch (error) {
			console.error("Error getting battery level:", error);
			return null;
		}
	};

	const destroy = () => {
		_bleSubscription.remove();
		_bleManager.destroy();
	};

	return {
		bluetoothState$,
		permissionGranted$,
		scanning$,
		devices$,
		connectedDeviceId$,
		isConnecting$,
		requestBluetoothPermission,
		startScan,
		stopScan,
		connectToDevice,
		isConnected: () => _connectedDevice !== null,
		getConnectedDeviceRssi,
		disconnectFromDevice,
		getAudioCodec,
		startAudioBytesListener,
		stopAudioBytesListener,
		getBatteryLevel,
		destroy,
	};
})();
