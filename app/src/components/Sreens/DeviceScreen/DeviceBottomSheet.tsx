import { DeviceAnimation } from "@/src/components/DeviceAnimation";
import { BluetoothStatusInfo } from "@/src/components/Sreens/DeviceScreen/BluetoothStatusInfo";
import { DeviceBatteryIcon } from "@/src/components/Sreens/DeviceScreen/DeviceBatteryIcon";
import { PairDevice } from "@/src/components/Sreens/DeviceScreen/PairDevice";
import { SearchingDevices } from "@/src/components/Sreens/DeviceScreen/SearchingDevices";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useIsBluetoothCorrectlySetup } from "@/src/hooks/useIsBluetoothCorrectlySetup";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { storage$ } from "@/src/services/storage";
import { observable } from "@legendapp/state";
import { Memo, use$ } from "@legendapp/state/react";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColor } from "react-native-uikit-colors";

export const DEVICE_SHEET_HEIGHT = 400;

export const dragValue$ = observable(0);

export function DeviceBottomSheet() {
	const connectedDevice = useConnectedDevice();
	const hasPairedDevice = use$(storage$.pairedDeviceId);
	const isBluetoothCorrectlySetup = useIsBluetoothCorrectlySetup();
	const color = useColor("quaternaryLabel");
	const insets = useSafeAreaInsets();

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
		<View
			// style={{ height: 400 + insets.bottom }}
			className="flex-1 items-center p-5 bg-secondary-system-background pt-8 pb-safe-offset-2 "
		>
			<View className="flex-row justify-center items-center w-full  mt-6 mb-8 ">
				<Text className="text-4xl text-center font-bold">
					{connectedDevice?.name}
				</Text>
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

			<View className="mt-5 mb-safe-offset-1">
				<Memo>
					{() => {
						const drag = dragValue$.get();
						let opacity = 1;
						if (drag <= DEVICE_SHEET_HEIGHT + insets.bottom) opacity = 1;
						else if (drag >= DEVICE_SHEET_HEIGHT + insets.bottom + 30)
							opacity = 0;
						else
							opacity = 1 - (drag - (DEVICE_SHEET_HEIGHT + insets.bottom)) / 30;
						return (
							<ChevronDown
								style={{ opacity }}
								size={24}
								color={color}
								strokeWidth={3}
							/>
						);
					}}
				</Memo>
			</View>

			<View className="w-full">
				<RowButton
					backgroundColor="tertiarySystemBackground"
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
