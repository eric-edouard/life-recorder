import { PairDevice } from "@/src/components/Sreens/DeviceBottomSheet/PairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceBottomSheet/SearchingDevices";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import React, { useEffect, useState } from "react";
import type { Device } from "react-native-ble-plx";

export function SearchAndPairDevice() {
	const [compatibleDevice, setCompatibleDevice] = useState<Device | null>();

	useEffect(() => {
		scanDevicesService.scanDevices({
			onCompatibleDeviceFound: (device) => {
				setCompatibleDevice(device);
			},
		});
	}, []);

	if (!compatibleDevice)
		return (
			<SearchingDevices
				title="Searching..."
				message="Looking for compatible devices"
			/>
		);

	return <PairDevice compatibleDevice={compatibleDevice} />;
}
