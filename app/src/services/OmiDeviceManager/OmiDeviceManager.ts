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
import { BleAudioCodec, type OmiDevice } from "./types";

export const omiDeviceManager = (() => {
	// Observable state using Legend State
	const bluetoothState$ = observable(State.Unknown);
	const permissionGranted$ = observable(false);
	const scanning$ = observable(false);
	const devices$ = observable<OmiDevice[]>([]);
	const connectedDeviceId$ = observable<string | null>(null);
	const isConnecting$ = observable(false);

	// BLE Manager
	const bleManager = new BleManager();
	let bleSubscription: Subscription;
	let stopScanCallback: () => void = () => {};
	let _connectedDevice: Device | null = null;

	// Initialize
	const initialize = () => {
		console.log("OmiDeviceManager: initializing");

		// Monitor Bluetooth state changes
		bleSubscription = bleManager.onStateChange((state) => {
			bluetoothState$.set(state);
			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				requestBluetoothPermission();
			}
		}, true);

		// Auto-start scanning when Bluetooth is on and permissions granted
		when(
			() =>
				permissionGranted$.get() === true &&
				bluetoothState$.get() === State.PoweredOn,
			() => setTimeout(() => startScan(), 0),
		);
	};

	// Run initialization
	initialize();

	const setConnectedDevice = (device: Device | null) => {
		_connectedDevice = device;
		connectedDeviceId$.set(device?.id || null);
	};

	const getConnectedDevice = (): Device | null => {
		return _connectedDevice;
	};

	/**
	 * Request Bluetooth permission from the user
	 * @returns Boolean indicating if permission was requested successfully
	 */
	const requestBluetoothPermission = () => {
		console.log("OmiDeviceManager: requestBluetoothPermission");
		try {
			if (Platform.OS === "ios") {
				bleManager.startDeviceScan(null, null, (error) => {
					if (error) {
						console.error("Permission error:", error);
						permissionGranted$.set(false);
						Alert.alert(
							"Bluetooth Permission",
							"Please enable Bluetooth permission in your device settings to use this feature.",
							[
								{ text: "Cancel", style: "cancel" },
								{
									text: "Open Settings",
									onPress: () => Linking.openSettings(),
								},
							],
						);
					} else {
						permissionGranted$.set(true);
					}
					// Stop scanning immediately after permission check
					bleManager.stopDeviceScan();
					return true;
				});
			} else if (Platform.OS === "android") {
				// On Android, we need to check for location and bluetooth permissions
				try {
					// This will trigger the permission dialog
					bleManager.startDeviceScan(null, null, (error) => {
						if (error) {
							console.error("Permission error:", error);
							permissionGranted$.set(false);
							Alert.alert(
								"Bluetooth Permission",
								"Please enable Bluetooth and Location permissions in your device settings to use this feature.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Open Settings",
										onPress: () => Linking.openSettings(),
									},
								],
							);
						} else {
							permissionGranted$.set(true);
						}
						// Stop scanning immediately after permission check
						bleManager.stopDeviceScan();
						return true;
					});
				} catch (error) {
					console.error("Error requesting permissions:", error);
					permissionGranted$.set(false);
				}
			}
			return false;
		} catch (error) {
			console.error("Error in requestBluetoothPermission:", error);
			permissionGranted$.set(false);
			return false;
		}
	};

	/**
	 * Start scanning for Omi devices
	 */
	const startScan = () => {
		console.log("OmiDeviceManager: startScan");

		// Get previously connected device ID
		const deviceId = storage.get("connectedDeviceId");

		// Check if Bluetooth is on and permission is granted
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
			console.warn("OmiDeviceManager: startScan: permissionGranted is false");
			requestBluetoothPermission();
			return;
		}

		// Set scanning state
		scanning$.set(true);

		// Start the BLE scan
		bleManager.startDeviceScan(null, null, (error, device) => {
			if (error) {
				console.error("Scan error:", error);
				return;
			}

			if (device?.name) {
				const omiDevice: OmiDevice = {
					id: device.id,
					name: device.name,
					rssi: device.rssi || 0,
				};

				// Add to devices list if not already there
				devices$.set((prev) => {
					// Check if device already exists
					if (prev.some((d) => d.id === omiDevice.id)) {
						return prev;
					}

					// Auto-connect to previously connected device
					if (deviceId && omiDevice.id === deviceId) {
						connectToDevice(omiDevice.id);
					}

					return [...prev, omiDevice];
				});
			}
		});

		// Auto-stop after 30 seconds
		const timeoutId = setTimeout(() => {
			stopScan();
		}, 30000);

		// Store stop scan callback
		stopScanCallback = () => {
			clearTimeout(timeoutId);
			bleManager.stopDeviceScan();
		};
	};

	/**
	 * Stop scanning for devices
	 */
	const stopScan = () => {
		console.log("OmiDeviceManager: stopScan");
		scanning$.set(false);
		if (stopScanCallback) {
			stopScanCallback();
			stopScanCallback = () => {};
		}
	};

	/**
	 * Connect to an Omi device
	 * @param deviceId The device ID to connect to
	 */
	const connectToDevice = async (deviceId: string) => {
		console.log("OmiDeviceManager: connectToDevice", deviceId);

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

			const device = await bleManager.connectToDevice(
				deviceId,
				connectionOptions,
			);

			if (Platform.OS === "android") {
				console.log("Requested MTU size of 512 during connection");
			}

			// Discover services and characteristics
			await device.discoverAllServicesAndCharacteristics();

			setConnectedDevice(device);

			// Store connected device ID
			storage.set("connectedDeviceId", deviceId);

			// Set up disconnection listener
			device.onDisconnected(() => {
				setConnectedDevice(null);
				storage.set("connectedDeviceId", null);
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

	/**
	 * Disconnect from the currently connected device
	 */
	const disconnectFromDevice = async () => {
		console.log("OmiDeviceManager: disconnectFromDevice");
		if (_connectedDevice) {
			await _connectedDevice.cancelConnection();
			setConnectedDevice(null);
			storage.set("connectedDeviceId", null);
		}
	};

	/**
	 * Check if connected to a device
	 * @returns True if connected
	 */
	const isConnected = (): boolean => {
		return _connectedDevice !== null;
	};

	/**
	 * Get the audio codec used by the device
	 * @returns Promise that resolves with the audio codec
	 */
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
	const getBatteryLevel = async (): Promise<number> => {
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
					return bytes[0] || -1; // Battery level is a percentage (0-100), use -1 if undefined
				}
			}

			return -1;
		} catch (error) {
			console.error("Error getting battery level:", error);
			return -1;
		}
	};

	/**
	 * Clean up resources
	 */
	const destroy = () => {
		console.log("OmiDeviceManager: destroy");
		bleSubscription.remove();
		bleManager.destroy();
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
		disconnectFromDevice,
		isConnected,
		getAudioCodec,
		startAudioBytesListener,
		stopAudioBytesListener,
		getBatteryLevel,
		destroy,
	};
})();
