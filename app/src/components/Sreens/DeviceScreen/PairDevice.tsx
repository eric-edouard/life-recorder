import { SearchingDevices } from "@/src/components/Sreens/DeviceScreen/SearchingDevices";
import { Text } from "@/src/components/ui/Text";
import { useGetCompatibleDevice } from "@/src/hooks/useGetCompatibleDevice";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { rssiToSignalStrength } from "@/src/utils/rssiToSignalStrength";
import { Button } from "@expo/ui/Button";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect } from "react";
import { View } from "react-native";

export function PairDevice() {
	const isConnecting = use$(deviceService.isConnecting$);
	const isConnected = use$(deviceService.isConnected$);
	const compatibleDevice = useGetCompatibleDevice();

	useEffect(() => {
		if (isConnected) {
			setTimeout(() => {
				router.back();
			}, 1000);
		}
	}, [isConnected]);

	if (!compatibleDevice)
		return (
			<SearchingDevices
				title="Searching..."
				message="Looking for compatible devices"
			/>
		);

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
