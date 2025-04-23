import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { ConnectedDeviceDetails } from "@/src/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { PairDevice } from "@/src/components/Sreens/DeviceBottomSheet/PairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceBottomSheet/SearchingDevices";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { storage$ } from "@/src/services/storage";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";
import React, { useState } from "react";
import type { Device } from "react-native-ble-plx";

// type BottomSheetState =
// 	| "bluetooth-not-set-up"
// 	| "searching-compatible-devices"
// 	| "pairing-device"
// 	| "searching-paired-devices"
// 	| "connected-device-details";

export function DeviceBottomSheetStateRouter() {
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();
	const hasPairedDevice = !!use$(storage$.pairedDeviceId);
	const connectedDevice = useConnectedDevice();
	const [compatibleDevice, setCompatibleDevice] = useState<Device | null>(null);

	if (!isBluetoothCorrectlySetup) {
		return <BluetoothStatusInfo />;
	}

	if (!compatibleDevice)
		return (
			<SearchingDevices
				title="Searching..."
				message="Looking for compatible devices"
				onCompatibleDeviceFound={setCompatibleDevice}
			/>
		);

	if (!hasPairedDevice) {
		return (
			<PairDevice
				compatibleDevice={compatibleDevice}
				onDevicePaired={() => {
					setTimeout(() => {
						router.back();
					}, 1500);
				}}
			/>
		);
	}

	if (!connectedDevice) {
		return (
			<SearchingDevices
				title="Searching..."
				message="Looking for your device"
				onCompatibleDeviceFound={(compatibleDevice) => {
					deviceService.connectToDevice(compatibleDevice.id);
				}}
			/>
		);
	}

	return <ConnectedDeviceDetails connectedDevice={connectedDevice} />;
}
