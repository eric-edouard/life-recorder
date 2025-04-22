import { bleManager } from "@/src/services/bleManager";
import { OMI_SERVICE_UUID } from "@/src/services/deviceService/constants";
import { alert } from "@/src/services/deviceService/utils/alert";
import { observable } from "@legendapp/state";
import { Linking } from "react-native";
import { type Device, State, type Subscription } from "react-native-ble-plx";

// const MY_DEVICE = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

const COMPATIBLE_SERVICES = [OMI_SERVICE_UUID];

export const scanDevicesService = (() => {
	let _bleSubscription: Subscription;

	const bluetoothState$ = observable(State.Unknown);
	const permissionStatus$ = observable<"granted" | "denied" | "unknown">(
		"unknown",
	);
	const scanning$ = observable(false);

	const initialize = () => {
		_bleSubscription = bleManager.onStateChange(async (state) => {
			bluetoothState$.set(state);
			if (state === State.PoweredOn) {
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
					permissionStatus$.set("denied");
					alert({
						title: "Bluetooth Permission",
						message:
							"Please enable Bluetooth permission in your device settings to use this feature.",
						buttons: [
							{ text: "Cancel", style: "cancel" },
							{
								text: "Open Settings",
								onPress: () => Linking.openSettings(),
							},
						],
					});
				} else {
					permissionStatus$.set("granted");
				}
				// Stop scanning immediately after permission check
				bleManager.stopDeviceScan();
			});
		} catch (error) {
			console.error("Error in requestBluetoothPermissions:", error);
			permissionStatus$.set("denied");
		}
	};

	const checkKindOfConnectedDevices = async (): Promise<Device | null> => {
		const devices = await bleManager.connectedDevices(COMPATIBLE_SERVICES);
		if (!devices.length) {
			return null;
		}
		return devices[0];
	};

	const scanDevices = ({
		onCompatibleDeviceFound,
	}: {
		onCompatibleDeviceFound: (device: Device) => void;
	}) => {
		if (bluetoothState$.peek() !== State.PoweredOn) {
			throw new Error("Bluetooth is Off");
		}

		if (permissionStatus$.peek() !== "granted") {
			throw new Error("Permissions not granted");
		}

		scanning$.set(true);

		bleManager.startDeviceScan(
			COMPATIBLE_SERVICES,
			{},
			async (error, foundDevice) => {
				if (error) {
					console.error("Scan error:", error);
					return;
				}
				if (!foundDevice?.name) {
					return;
				}

				if (foundDevice.serviceUUIDs?.includes(OMI_SERVICE_UUID)) {
					onCompatibleDeviceFound?.(foundDevice);
					stopScan();
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
		permissionStatus$,
		checkKindOfConnectedDevices,
		scanning$,
		requestBluetoothPermission,
		scanDevices,
		stopScan,
		destroy,
	};
})();
