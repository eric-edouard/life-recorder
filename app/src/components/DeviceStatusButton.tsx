import { PressableLayer } from "@app/src/components/PressableLayer";
import { Dot, type DotColor } from "@app/src/components/ui/Dot";
import { Text } from "@app/src/components/ui/Text";
import { useConnectedDevice } from "@app/src/hooks/useConnectedDevice";
import { deviceService } from "@app/src/services/deviceService/deviceService";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { storage$ } from "@app/src/services/storage";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";
import { View } from "react-native";
import { State } from "react-native-ble-plx";

export const DeviceStatusButton = () => {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const connectedDevice = useConnectedDevice();
	const batteryLevel = use$(deviceService.batteryLevel$);
	const isConnecting = use$(deviceService.isConnecting$);
	const hasPairedDevice = use$(storage$.pairedDevice);

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
			return batteryLevel ? `${batteryLevel}%` : "Loading...";
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
