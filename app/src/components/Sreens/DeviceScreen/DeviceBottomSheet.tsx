import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceScreen/BluetoothStatusInfo";
import { PairDevice } from "@/src/components/Sreens/DeviceScreen/PairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceScreen/SearchingDevices";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { Dot } from "@/src/components/ui/Dot";
import { InsetList } from "@/src/components/ui/Lists/InsetList";
import { InsetListRow } from "@/src/components/ui/Lists/InsetListRow";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { storage$ } from "@/src/services/storage";
import { Memo, use$ } from "@legendapp/state/react";
import { Bluetooth } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

export function DeviceBottomSheet() {
	const connectedDevice = useConnectedDevice();
	const hasPairedDevice = use$(storage$.pairedDeviceId);
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();

	if (!isBluetoothCorrectlySetup) {
		return <BluetoothStatusInfo />;
	}

	if (!hasPairedDevice) {
		return <PairDevice />;
	}

	if (!connectedDevice) {
		return (
			<SearchingDevices
				title="Searching..."
				message="Looking for your device"
				onCompatibleDeviceFound={(compatibleDevice) => {
					deviceService.connectToDevice(compatibleDevice.id);
				}}
			/>
		);
	}

	return (
		<View className="flex-1 items-center p-5  bg-secondary-system-background pt-8 pb-safe-offset-10">
			<InsetList
				backgroundColor="tertiary"
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
					backgroundColor="tertiary"
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
				<Memo>
					{() => (
						<InsetListRow
							backgroundColor="tertiary"
							title="Battery Level"
							detail={`${deviceService.batteryLevel$.get() ?? "N/A"}%`}
						/>
					)}
				</Memo>
				<InsetListRow
					backgroundColor="tertiary"
					title="Signal Strength"
					detail={`${deviceService.getConnectedDeviceRssi() ?? "N/A"}`}
				/>
			</InsetList>

			<View className="mt-4 w-full">
				<RowButton
					backgroundColor="tertiary"
					colorStyle="destructive"
					title="Unpair This Device"
					onPress={() => {
						alert({
							title: `Unpair`,
							message: `Disconnect from ${connectedDevice.name}?`,
							buttons: [
								{
									text: "Cancel",
									style: "cancel",
								},
								{
									text: "Unpair",
									style: "destructive",
									onPress: () => {
										deviceService.disconnectFromDevice();
									},
								},
							],
						});
					}}
				/>
			</View>
		</View>
	);
}
