import type { LiveUtterance } from "@app/src/services/liveTranscriptionService";
import { format } from "date-fns";
import React from "react";
import { View } from "react-native";
import { Text } from "./ui/Text";

export const LiveUtteranceItem = ({ item }: { item: LiveUtterance }) => {
	const formattedTime = format(new Date(item.startTime), "hh:mm:ss a");
	const speaker =
		item.speakerStatus === "processing"
			? "Processing..."
			: item.speakerId || "Unknown";

	return (
		<View className="mb-2.5 p-3 bg-secondary-system-background rounded-lg shadow-sm">
			<Text className="text-xs text-secondary-label mb-1 font-medium">
				{formattedTime}
			</Text>
			<Text className="text-[15px] text-label">{item.transcript}</Text>
			<Text className="text-sm text-tertiary-label italic">{speaker}</Text>
		</View>
	);
};
