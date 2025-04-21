// import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
// import { defer } from "@/src/utils/defer";
// import { when } from "@legendapp/state";
// import { State } from "react-native-ble-plx";

// when(
// 	() =>
// 		scanDevicesService.bluetoothState$.get() === State.PoweredOn &&
// 		scanDevicesService.permissionGranted$.get() === true,
// 	() => {
// 		defer(() => scanDevicesService.scanDevices());
// 	},
// );

// export const useAutoScanDevices = () => {};
