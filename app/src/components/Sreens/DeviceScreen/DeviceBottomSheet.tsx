import { DeviceAnimation } from "@/src/components/DeviceAnimation";
import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceScreen/BluetoothStatusInfo";
import { DeviceBatteryIcon } from "@/src/components/Sreens/DeviceScreen/DeviceBatteryIcon";
import { PairDevice } from "@/src/components/Sreens/DeviceScreen/PairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceScreen/SearchingDevices";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { storage$ } from "@/src/services/storage";
import { Memo, use$ } from "@legendapp/state/react";
import { CircleEllipsis } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useColor } from "react-native-uikit-colors";

export function DeviceBottomSheet() {
	const connectedDevice = useConnectedDevice();
	const hasPairedDevice = use$(storage$.pairedDeviceId);
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();
	const color = useColor("quaternaryLabel");

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
		<View className="flex-1 items-center p-5 bg-secondary-system-background pt-8 pb-safe-offset-10">
			<View className="absolute top-6 right-6">
				<CircleEllipsis size={24} color={color} strokeWidth={3} />
			</View>
			<View className="flex-row justify-center items-center w-full  mt-6 mb-8 ">
				<Text className="text-4xl text-center font-bold">
					{connectedDevice?.name}
				</Text>
				{/* <ChevronRight size={24} color="black" strokeWidth={3} /> */}
			</View>
			<View className="w-full h-56 ">
				<DeviceAnimation />
			</View>
			<Memo>
				{() => (
					<View className="">
						<DeviceBatteryIcon
							percentage={deviceService.batteryLevel$.get() ?? 0}
						/>
						<Text className="text-lg text-center text-label mt-[-6px]">
							{deviceService.batteryLevel$.get() ?? 0}%
						</Text>
					</View>
				)}
			</Memo>
			{/* <InsetList
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
				<Memo>
					{() => (
						<InsetListRow
							backgroundColor="tertiary"
							title="Signal Strength"
							detail={`${capitalize(deviceService.rssi$.get() ?? "N/A")}`}
						/>
					)}
				</Memo>
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
			</View> */}
		</View>
	);
}
