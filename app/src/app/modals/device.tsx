import { Dot } from "@/src/components/Dot";
import { ScanDevices } from "@/src/components/Sreens/DeviceScreen/ScanDevices";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { MessageCard } from "@/src/components/ui/Cards/MessageCard";
import { InsetList } from "@/src/components/ui/Lists/InsetList";
import { InsetListRow } from "@/src/components/ui/Lists/InsetListRow";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { StatusBar } from "expo-status-bar";
import { Bluetooth } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";
import { State } from "react-native-ble-plx";
import { useColor } from "react-native-uikit-colors";

export default function DeviceModal() {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const connectedDevice = useConnectedDevice();
	const batteryLevel = useDeviceBatteryLevel();
	const isConnecting = use$(deviceService.isConnecting$);
	const hasPairedDevice = deviceService.hasPairedDevice();
	const permissionGranted = use$(scanDevicesService.permissionGranted$);
	const gray2 = useColor("gray2");

	// useEffect(() => {
	// 	scanDevicesService.scanDevices();
	// }, [permissionGranted]);
	if (!permissionGranted) {
		return (
			<MessageCard
				className="m-5"
				icon={<Bluetooth size={36} color={gray2} />}
				title="Bluetooth permission is off"
				message="Please enable Bluetooth permission to connect to your device"
			/>
		);
	}

	if (bluetoothState !== State.PoweredOn) {
		return (
			<MessageCard
				className="m-5"
				icon={<Bluetooth size={36} color={gray2} />}
				title="Bluetooth is off"
				message="Please enable Bluetooth to connect to your device"
			/>
		);
	}

	if (!hasPairedDevice) {
		return <ScanDevices />;
	}

	return (
		<View className="flex-1 items-center p-6 bg-system-grouped-background">
			{connectedDevice && (
				<>
					<InsetList
						headerText="My device"
						listHeader={
							<View className="items-center mb-4 pt-8">
								<View className="bg-secondary-system-fill p-4 rounded-full mb-4 ">
									<Bluetooth size={24} color="white" />
								</View>
								<Text className="text-2xl font-bold mb-6">Omi Dev Kit 2</Text>
							</View>
						}
					>
						<InsetListRow
							title="Status"
							accessory={
								<View className="flex-row items-center">
									<Text className="mr-2 text-secondary-label text-lg">
										{connectedDevice ? "Connected" : "Disconnected"}
									</Text>
									<Dot color={connectedDevice ? "green" : "red"} />
								</View>
							}
						/>
						<InsetListRow title="Battery Level" detail="67%" />
						<InsetListRow title="Signal Strength" detail="Strong" />
					</InsetList>

					<View className="mt-4 w-full">
						<RowButton
							colorStyle="destructive"
							title="Unpair This Device"
							onPress={() => {
								deviceService.disconnectFromDevice();
							}}
						/>
					</View>
				</>
			)}
			{/* {!connectedDevice && (

			)} */}
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
}
