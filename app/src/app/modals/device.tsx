import { DeviceCard } from "@/src/components/DeviceModal/DeviceCard";
import { RowButton } from "@/src/components/ui/Buttons/RowButton";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Platform, View } from "react-native";

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
				<RowButton
					colorStyle="destructive"
					title="Unpair This Device"
					onPress={() => {}}
				/>
			</View>
			<StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
		</View>
	);
}
