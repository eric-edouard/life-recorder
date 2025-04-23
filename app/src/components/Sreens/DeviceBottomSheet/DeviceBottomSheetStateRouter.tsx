import { BluetoothStatusInfo } from "@app/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { ConnectedDeviceDetails } from "@app/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { SearchAndPairDevice } from "@app/components/Sreens/DeviceBottomSheet/SearchAndPairDevice";
import { SearchingYourDevice } from "@app/components/Sreens/DeviceBottomSheet/SearchingYourDevice";
import { useConnectedDevice } from "@app/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@app/hooks/useIsBluetoothCorrectlySetup";
import { storage$ } from "@app/services/storage";
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
