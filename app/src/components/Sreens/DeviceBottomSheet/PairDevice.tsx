import { Text } from "@/src/components/ui/Text";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { rssiToSignalStrength } from "@/src/utils/rssiToSignalStrength";
import { Button } from "@expo/ui/swift-ui";
import { use$ } from "@legendapp/state/react";
import { SymbolView } from "expo-symbols";
import React from "react";
import { View } from "react-native";
import type { Device } from "react-native-ble-plx";

type Props = {
	compatibleDevice: Device;
	onDevicePaired: () => void;
};

export function PairDevice({ compatibleDevice, onDevicePaired }: Props) {
	const isConnecting = use$(deviceService.isConnecting$);
	const isConnected = use$(deviceService.isConnected$);

	return (
		<View className={"flex items-center gap-2 pt-20 pb-safe-offset-12 "}>
			<SymbolView
				name="microphone.circle.fill"
				colors={["red", "blue"]}
				animationSpec={{
					effect: {
						type: "bounce",
					},
					speed: 0.2,
					repeating: true,
				}}
				tintColor={isConnected ? "green" : "gray"}
				size={68}
				style={{
					opacity: 0.8,
				}}
			/>
			<View>
				<Text className="text-2xl font-bold text-center mb-2 mt-6 text-label">
					{compatibleDevice.name}
				</Text>
				<Text className="text-lg text-tertiary-label text-center mx-8 mb-6 capitalize">
					Signal Strength: {rssiToSignalStrength(compatibleDevice.rssi ?? 0)}
				</Text>
			</View>

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
							onDevicePaired();
						}}
						variant="borderedProminent"
					>
						{isConnecting ? "Connecting..." : "Pair Device"}
					</Button>
				)}
			</View>
		</View>
	);
}
