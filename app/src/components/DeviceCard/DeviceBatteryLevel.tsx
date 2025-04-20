import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import { SymbolView } from "expo-symbols";
import React from "react";
import { View } from "react-native";
import { useColor } from "react-native-uikit-colors";
import { Text } from "../Text";

export const DeviceBatteryLevel = () => {
	const tintColor = useColor("green");
	const batteryLevel = useDeviceBatteryLevel();

	if (!batteryLevel) {
		return null;
	}
	return (
		<View className="flex-row items-center gap-2 ">
			<View className="flex-row justify-center items-center w-6">
				<SymbolView
					name="battery.100"
					size={18}
					tintColor={tintColor}
					style={{ opacity: 0.8 }}
				/>
			</View>
			<Text className="font-normal text-secondary-label">
				Battery: {batteryLevel}%
			</Text>
		</View>
	);
};
