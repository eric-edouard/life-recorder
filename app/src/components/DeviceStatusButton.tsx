import { Dot, type DotColor } from "@/src/components/Dot";
import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/ui/Text";
import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";
import { View } from "react-native";
import { State } from "react-native-ble-plx";

export const DeviceStatusButton = () => {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const connectedDevice = useConnectedDevice();
	const batteryLevel = useDeviceBatteryLevel();
	const isConnecting = use$(deviceService.isConnecting$);
	const hasPairedDevice = deviceService.hasPairedDevice();

	const getDotColor = (): DotColor => {
		if (connectedDevice) {
			return "green";
		}
		if (isConnecting) {
			return "blue";
		}
		if (hasPairedDevice) {
			return "red";
		}
		return "gray";
	};

	const getText = () => {
		if (connectedDevice) {
			return `${batteryLevel}%`;
		}
		if (isConnecting) {
			return "Connecting...";
		}
		if (hasPairedDevice) {
			return "Disconnected";
		}
		if (bluetoothState !== State.PoweredOn) {
			return "Bluetooth off";
		}
		return "No Paired Device";
	};

	return (
		<PressableLayer onPress={() => router.push("/modals/device")}>
			<View className="flex-row gap-3 justify-center items-center py-3 px-4">
				<Dot color={getDotColor()} />
				<Text className="text-md font-bold text-secondary-label">
					{getText()}
				</Text>
			</View>
		</PressableLayer>
	);
};
