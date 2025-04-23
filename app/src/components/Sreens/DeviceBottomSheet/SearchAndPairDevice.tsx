import { AnimatedBluetoothScanning } from "@app/components/Sreens/DeviceBottomSheet/AnimatedBluetoothScanning";
import { PairDevice } from "@app/components/Sreens/DeviceBottomSheet/PairDevice";
import { IconAndText } from "@app/components/ui/IconAndText";
import { scanDevicesService } from "@app/services/deviceService/scanDevicesService";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
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
			<View className="flex-1 items-center justify-center mb-safe-offset-2 pt-14 pb-4 ">
				<IconAndText
					className="mb-safe-offset-2 mt-2"
					icon={<AnimatedBluetoothScanning />}
					title="Searching..."
					message="Looking for compatible devices"
				/>
			</View>
		);

	return <PairDevice compatibleDevice={compatibleDevice} />;
}
