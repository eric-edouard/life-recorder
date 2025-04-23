import { DeviceBatteryIcon } from "@/src/components/Sreens/DeviceBottomSheet/DeviceBatteryIcon";
import { DeviceLargeDetails } from "@/src/components/Sreens/DeviceBottomSheet/DeviceLargeDetails";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { Text } from "@/src/components/ui/Text";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { observable } from "@legendapp/state";
import { Memo } from "@legendapp/state/react";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import type { Device } from "react-native-ble-plx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColor } from "react-native-uikit-colors";

export const DEVICE_SHEET_HEIGHT = 400;

export const dragValue$ = observable(0);

type Props = {
	connectedDevice: Device;
};

export function ConnectedDeviceDetails({ connectedDevice }: Props) {
	const color = useColor("quaternaryLabel");
	const insets = useSafeAreaInsets();

	return (
		<DeviceLargeDetails
			device={connectedDevice}
			footer={
				<View className="w-full flex items-center">
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
					<View className="mt-5 mb-safe-offset-1 ">
						<Memo>
							{() => {
								const drag = dragValue$.get();
								let opacity = 1;
								if (drag <= DEVICE_SHEET_HEIGHT + insets.bottom) opacity = 1;
								else if (drag >= DEVICE_SHEET_HEIGHT + insets.bottom + 30)
									opacity = 0;
								else
									opacity =
										1 - (drag - (DEVICE_SHEET_HEIGHT + insets.bottom)) / 30;
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
			}
		/>
	);
}
