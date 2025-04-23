import { scanDevicesService } from "@app/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { State } from "react-native-ble-plx";

export const useIsBluetoothCorrectlySetup = () => {
	return use$(
		scanDevicesService.permissionStatus$.get() === "granted" &&
			scanDevicesService.bluetoothState$.get() === State.PoweredOn,
	);
};
