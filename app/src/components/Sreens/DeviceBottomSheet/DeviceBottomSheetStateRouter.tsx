import { BluetoothStatusInfo } from "@app/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { ConnectedDeviceDetails } from "@app/src/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { SearchAndPairDevice } from "@app/src/components/Sreens/DeviceBottomSheet/SearchAndPairDevice";
import { SearchingYourDevice } from "@app/src/components/Sreens/DeviceBottomSheet/SearchingYourDevice";
import { useConnectedDevice } from "@app/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@app/src/hooks/useIsBluetoothCorrectlySetup";
import { storage$ } from "@app/src/services/storage";
import { use$ } from "@legendapp/state/react";
import React from "react";

export function DeviceBottomSheetStateRouter() {
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();
	const hasPairedDevice = !!use$(storage$.pairedDevice);
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
