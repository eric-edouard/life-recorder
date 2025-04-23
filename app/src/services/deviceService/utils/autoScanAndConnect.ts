import { deviceService } from "@app/services/deviceService/deviceService";
import { scanDevicesService } from "@app/services/deviceService/scanDevicesService";
import { storage$ } from "@app/services/storage";
import { defer } from "@app/utils/defer";
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
				const pairedDeviceId = storage$.pairedDevice.id.peek();
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
