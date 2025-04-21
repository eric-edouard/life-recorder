import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceScreen/BluetoothStatusInfo";
import { PairDevice } from "@/src/components/Sreens/DeviceScreen/PairDevice";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { Dot } from "@/src/components/ui/Dot";
import { InsetList } from "@/src/components/ui/Lists/InsetList";
import { InsetListRow } from "@/src/components/ui/Lists/InsetListRow";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { StatusBar } from "expo-status-bar";
import { Bluetooth } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";

export function DeviceBottomSheet() {
	const connectedDevice = useConnectedDevice();
	const hasPairedDevice = deviceService.hasPairedDevice();
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();

	if (!isBluetoothCorrectlySetup) {
		return <BluetoothStatusInfo />;
	}

	if (!hasPairedDevice) {
		return <PairDevice />;
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
