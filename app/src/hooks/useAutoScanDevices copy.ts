import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { useEffect } from "react";
import { State } from "react-native-ble-plx";

export const useAutoScanDevices = () => {
	const permissionGranted = use$(scanDevicesService.permissionGranted$);
	const bluetoothState = use$(scanDevicesService.bluetoothState$);

	useEffect(() => {
		if (permissionGranted && bluetoothState === State.PoweredOn) {
			scanDevicesService.scanDevices();
		}
	}, [permissionGranted, bluetoothState]);
};
