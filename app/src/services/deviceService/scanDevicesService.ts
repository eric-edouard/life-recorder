import { bleManager } from "@/src/services/bleManager";
import { observable } from "@legendapp/state";
import { type Device, State, type Subscription } from "react-native-ble-plx";
import {
	PERMISSIONS,
	type PermissionStatus,
	check,
	request,
} from "react-native-permissions";
import type { BluetoothDevice } from "./types";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export const scanDevicesService = (() => {
	let _bleSubscription: Subscription;

	const bluetoothState$ = observable(State.Unknown);
	const permissionStatus$ = observable<PermissionStatus | "unknown">("unknown");
	const scanning$ = observable(false);
	const devices$ = observable<BluetoothDevice[]>([]);
	const compatibleDeviceId$ = observable<string | null>(null);

	const initialize = () => {
		_bleSubscription = bleManager.onStateChange((state) => {
			bluetoothState$.set(state);
			if (state === State.PoweredOn) {
				// Bluetooth is on, now we can request permission
				requestBluetoothPermission();
			}
		}, true);

		check(PERMISSIONS.IOS.BLUETOOTH).then((result) =>
			permissionStatus$.set(result),
		);
	};

	initialize();

	const requestBluetoothPermission = async () => {
		request(PERMISSIONS.IOS.BLUETOOTH).then((result) =>
			permissionStatus$.set(result),
		);
	};

	const scanDevices = ({
		autoConnectDeviceId,
		onDeviceFound,
	}: {
		autoConnectDeviceId?: string;
		onDeviceFound?: (device: Device) => void;
	}) => {
		if (bluetoothState$.peek() !== State.PoweredOn) {
			throw new Error("Bluetooth is Off");
		}

		if (permissionStatus$.peek() !== "granted") {
			throw new Error("Permissions not granted");
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

				if (!foundDevice?.name) {
					return;
				}

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
				onDeviceFound?.(foundDevice);

				// Add to devices list if not already there
				devices$.set((prevDevices) => {
					// Check if device already exists
					if (prevDevices.some((d) => d.id === device.id)) {
						return prevDevices;
					}

					return [...prevDevices, device];
				});
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
		permissionStatus$,
		scanning$,
		devices$,
		compatibleDeviceId$,
		requestBluetoothPermission,
		scanDevices,
		stopScan,
		destroy,
	};
})();
