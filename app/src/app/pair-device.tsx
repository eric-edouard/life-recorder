import React, { useEffect } from "react";
import { Linking, Platform, SafeAreaView, ScrollView } from "react-native";

// Import components
import StatusBanner from "@/src/components/BlutoothPermissionsbanner";
import DeviceList from "@/src/components/DeviceList";
import { omiDeviceManager } from "@/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";

export default function PairDevice() {
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const devices = use$(omiDeviceManager.devices$);
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);

	useEffect(() => {
		omiDeviceManager.startScan();
	}, []);

	return (
		<SafeAreaView className="flex-1 bg-[#f5f5f5]">
			<ScrollView
				className={`p-5 ${Platform.OS === "android" ? "pt-10" : ""} pb-[200px]`}
			>
				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={omiDeviceManager.requestBluetoothPermission}
					onOpenSettings={() => Linking.openSettings()}
				/>

				{/* Device List */}
				{devices.length > 0 && (
					<DeviceList
						devices={devices}
						connected={!!connectedDeviceId}
						connectedDeviceId={connectedDeviceId}
						onConnect={omiDeviceManager.connectToDevice}
						onDisconnect={omiDeviceManager.disconnectFromDevice}
					/>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
