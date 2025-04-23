import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { ConnectedDeviceDetails } from "@/src/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { SearchAndPairDevice } from "@/src/components/Sreens/DeviceBottomSheet/SearchAndPairDevice";
import { SearchingYourDevice } from "@/src/components/Sreens/DeviceBottomSheet/SearchingYourDevice";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { storage$ } from "@/src/services/storage";
import { use$ } from "@legendapp/state/react";
import React from "react";

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

	return <SearchingYourDevice />;
}
