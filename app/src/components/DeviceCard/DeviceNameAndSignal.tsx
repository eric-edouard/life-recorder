import { DeviceSignalStrength } from "@/src/components/DeviceCard/DeviceSignalStrength";
import { Text } from "@/src/components/Text";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";
import { View } from "react-native";

export const DeviceNameAndSignal = () => {
	const connectedDevice = use$(
		deviceService.connectedDeviceId$.get()
			? deviceService.getConnectedDevice()
			: null,
	);

	return (
		<View className="flex-row items-center gap-2">
			<View className="flex-row justify-center items-center w-6 ">
				<DeviceSignalStrength size={15} />
			</View>
			<Text className="font-normal text-foreground-level-1 ">
				{connectedDevice?.name ?? "No device connected"}
			</Text>
		</View>
	);
};
