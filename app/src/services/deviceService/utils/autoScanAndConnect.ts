import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { storage$ } from "@/src/services/storage";
import { defer } from "@/src/utils/defer";
import { when } from "@legendapp/state";
import { State } from "react-native-ble-plx";

export const autoScanAndConnect = () => {
	// automatically scan for devices on startup if conditions are met
	when(
		() =>
			scanDevicesService.bluetoothState$.get() === State.PoweredOn &&
			scanDevicesService.permissionStatus$.get() === "granted",
		() => {
			defer(async () => {
				const pairedDeviceId = storage$.pairedDeviceId.peek();
				if (!pairedDeviceId) {
					return;
				}
				const kindOfConnectedDevice =
					await scanDevicesService.checkKindOfConnectedDevices();

				if (!kindOfConnectedDevice) {
					scanDevicesService.scanDevices({
						onCompatibleDeviceFound: (device) => {
							if (device.id === pairedDeviceId) {
								deviceService.connectToDevice(device.id);
							}
						},
					});
					return;
				}
				if (pairedDeviceId && kindOfConnectedDevice?.id === pairedDeviceId) {
					deviceService.connectToDevice(kindOfConnectedDevice.id);
					return;
				}
			});
		},
	);
};
