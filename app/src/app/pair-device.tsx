import StatusBanner from "@/src/components/BlutoothPermissionsbanner";
import DeviceList from "@/src/components/DeviceList";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import React, { useEffect } from "react";
import { Linking, Platform, SafeAreaView, ScrollView } from "react-native";

export default function PairDevice() {
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const devices = use$(scanDevicesService.devices$);
	const bluetoothState = use$(scanDevicesService.bluetoothState$);

	useEffect(() => {
		scanDevicesService.scanDevices();
	}, []);

	return (
		<SafeAreaView className="flex-1 bg-system-background">
			<ScrollView
				className={`p-5 ${Platform.OS === "android" ? "pt-10" : ""} pb-[200px]`}
			>
				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={scanDevicesService.requestBluetoothPermission}
					onOpenSettings={() => Linking.openSettings()}
				/>

				{/* Device List */}
				{devices.length > 0 && (
					<DeviceList
						devices={devices}
						connected={!!connectedDeviceId}
						connectedDeviceId={connectedDeviceId}
						onConnect={deviceService.connectToDevice}
						onDisconnect={deviceService.disconnectFromDevice}
					/>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
