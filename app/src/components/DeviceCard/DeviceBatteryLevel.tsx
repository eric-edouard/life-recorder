import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import { SymbolView } from "expo-symbols";
import React from "react";
import { View } from "react-native";
import { Text } from "../Text";

export const DeviceBatteryLevel = () => {
	const batteryLevel = useDeviceBatteryLevel();

	const colors = useThemeColors();
	if (!batteryLevel) {
		return null;
	}
	return (
		<View className="flex-row items-center gap-2 ">
			<View className="flex-row justify-center items-center w-6">
				<SymbolView
					name="battery.100"
					size={18}
					tintColor={colors["--green"]}
					style={{ opacity: 0.8 }}
				/>
			</View>
			<Text className="font-normal text-foreground-level-1 ">
				Battery: {batteryLevel}%
			</Text>
		</View>
	);
};
