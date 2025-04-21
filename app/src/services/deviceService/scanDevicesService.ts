import { bleManager } from "@/src/services/bleManager";
import { observable } from "@legendapp/state";
import { Alert, Linking } from "react-native";
import { State, type Subscription } from "react-native-ble-plx";
import type { BluetoothDevice } from "./types";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export const scanDevicesService = (() => {
	let _bleSubscription: Subscription;

	const bluetoothState$ = observable(State.Unknown);
	const permissionGranted$ = observable(false);
	const scanning$ = observable(false);
	const devices$ = observable<BluetoothDevice[]>([]);

	const initialize = () => {
		_bleSubscription = bleManager.onStateChange((state) => {
			bluetoothState$.set(state);
			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				requestBluetoothPermission();
			}
		}, true);
	};

	initialize();

	const requestBluetoothPermission = () => {
		try {
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
			});
		} catch (error) {
			console.error("Error in requestBluetoothPermissions:", error);
			permissionGranted$.set(false);
		}
	};

	const scanDevices = (autoConnectDeviceId?: string) => {
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

		scanning$.set(true);

		bleManager.startDeviceScan(
			autoConnectDeviceId ? [autoConnectDeviceId] : null,
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

						return [...prevDevices, device];
					});
				}
			},
		);
	};

	const stopScan = () => {
		scanning$.set(false);
		return bleManager.stopDeviceScan();
	};

	const destroy = () => {
		_bleSubscription.remove();
		bleManager.destroy();
	};

	return {
		bluetoothState$,
		permissionGranted$,
		scanning$,
		devices$,
		requestBluetoothPermission,
		scanDevices,
		stopScan,
		destroy,
	};
})();
