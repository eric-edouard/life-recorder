import { Dot } from "@/src/components/Dot";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
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

export default function DeviceModal() {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const connectedDevice = useConnectedDevice();
	const batteryLevel = useDeviceBatteryLevel();
	const isConnecting = use$(deviceService.isConnecting$);
	const hasPairedDevice = deviceService.hasPairedDevice();

	if (bluetoothState !== State.PoweredOn) {
		return (
			<View className="flex-1 items-center p-6 bg-system-grouped-background">
				<Text>Bluetooth is off</Text>
			</View>
		);
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
			{!connectedDevice && (
				<>
					<InsetList
						headerText="compatible devices"
						headerLoading
						emptyStateText="No compatible devices found"
					>
						{/* <InsetListRow title="Omi Dev Kit 2" /> */}
					</InsetList>
					<InsetList className="mt-6" headerText="other devices">
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
						<InsetListRow title="Bose Speaker" />
					</InsetList>
				</>
			)}
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
}
