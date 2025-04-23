import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { ConnectedDeviceDetails } from "@/src/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { SearchAndPairDevice } from "@/src/components/Sreens/DeviceBottomSheet/SearchAndPairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceBottomSheet/SearchingDevices";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { storage$ } from "@/src/services/storage";
import { use$ } from "@legendapp/state/react";
import React from "react";

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

	if (!isBluetoothCorrectlySetup) {
		return <BluetoothStatusInfo />;
	}

	if (connectedDevice) {
		return <ConnectedDeviceDetails connectedDevice={connectedDevice} />;
	}

	if (!hasPairedDevice) {
		return <SearchAndPairDevice />;
	}

	return (
		<SearchingDevices title="Searching..." message="Looking for your device" />
	);
}
