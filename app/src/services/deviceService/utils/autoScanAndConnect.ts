import { deviceService } from "@app/src/services/deviceService/deviceService";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { storage$ } from "@app/src/services/storage";
import { defer } from "@app/src/utils/defer";
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
						onPairedDeviceFound: (device) =>
							deviceService.connectToDevice(device.id),
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
