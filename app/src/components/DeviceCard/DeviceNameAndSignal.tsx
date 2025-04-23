import { DeviceSignalStrength } from "@app/components/DeviceCard/DeviceSignalStrength";
import { Text } from "@app/components/ui/Text";
import { deviceService } from "@app/services/deviceService/deviceService";
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
			<Text className="font-normal text-secondary-label">
				{connectedDevice?.name ?? "No device connected"}
			</Text>
		</View>
	);
};
