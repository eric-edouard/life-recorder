import { DeviceLargeDetails } from "@/src/components/Sreens/DeviceBottomSheet/DeviceLargeDetails";
import { Text } from "@/src/components/ui/Text";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { Button } from "@expo/ui/swift-ui";
import { use$ } from "@legendapp/state/react";
import React from "react";
import { View } from "react-native";
import type { Device } from "react-native-ble-plx";

type Props = {
	compatibleDevice: Device;
	onDevicePaired?: () => void;
};

export function PairDevice({ compatibleDevice, onDevicePaired }: Props) {
	const isConnecting = use$(deviceService.isConnecting$);
	const isConnected = use$(deviceService.isConnected$);

	return (
		<DeviceLargeDetails
			device={compatibleDevice}
			footer={
				<View className="w-full flex items-center mt-4 mb-4">
					<View className="h-14 flex items-center justify-center">
						{isConnected ? (
							<Text className="text-xl font-bold text-center text-label">
								Device paired !
							</Text>
						) : (
							<Button
								disabled={isConnecting}
								onPress={async () => {
									await deviceService.connectToDevice(compatibleDevice.id);
									onDevicePaired?.();
								}}
								variant="borderedProminent"
							>
								{isConnecting ? "Connecting..." : "Pair Device"}
							</Button>
						)}
					</View>
				</View>
			}
		/>
	);
}
