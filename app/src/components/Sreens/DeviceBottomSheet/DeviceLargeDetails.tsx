import { DeviceAnimation } from "@app/src/components/DeviceAnimation";
import { Text } from "@app/src/components/ui/Text";
import type React from "react";
import { View } from "react-native";
import type { Device } from "react-native-ble-plx";

type Props = {
	device: Device;
	footer: React.ReactNode;
};

export function DeviceLargeDetails({ device, footer }: Props) {
	return (
		<View className="flex-1 items-center p-5 bg-secondary-system-background pt-8 pb-safe-offset-2 ">
			<View className="flex-row justify-center items-center w-full  mt-6 mb-8 ">
				<Text className="text-4xl text-center font-bold">{device?.name}</Text>
			</View>
			<View className="w-full h-56 ">
				<DeviceAnimation />
			</View>
			{footer}
		</View>
	);
}
