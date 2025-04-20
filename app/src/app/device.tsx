import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/Text";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Platform, View } from "react-native";
import { DeviceCard } from "../components/DeviceModal/DeviceCard";

export default function DeviceModal() {
	const [isConnected, setIsConnected] = useState(true);

	return (
		<View className="flex-1 items-center p-6  bg-system-background">
			<DeviceCard
				deviceName="Omi Dev Kit 2"
				connected={isConnected}
				signalStrength="Strong"
			/>
			<View className="mt-4 w-full">
				<PressableLayer
					onPress={() => {}}
					className="px-4 py-3 w-full flex justify-center h-row"
				>
					<Text className="text-red">Unpair This Device</Text>
				</PressableLayer>
			</View>
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
}
