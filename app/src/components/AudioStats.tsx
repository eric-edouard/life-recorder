import React from "react";
import { View } from "react-native";
import { Text } from "./Text";

interface AudioStatsProps {
	audioPacketsReceived: number;
	showIf?: boolean;
}

const AudioStats = ({
	audioPacketsReceived,
	showIf = true,
}: AudioStatsProps) => {
	if (!showIf) return null;

	return (
		<View className="mt-4 p-3 bg-[#f0f0f0] rounded-lg items-center border-l-4 border-l-[#FF9500]">
			<Text className="text-sm font-medium text-[#555]">
				Audio Packets Received:
			</Text>
			<Text className="text-lg font-bold text-[#FF9500] mt-1.5">
				{audioPacketsReceived}
			</Text>
		</View>
	);
};

export default AudioStats;
