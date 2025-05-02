import type { LiveUtterance } from "@app/src/services/liveTranscriptionService";
import type { Speaker } from "@app/src/services/speakersService";
import { format } from "date-fns";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Text } from "./ui/Text";

export const LiveUtteranceItem = ({
	item,
	speakers,
}: {
	item: LiveUtterance;
	speakers: Speaker[];
}) => {
	const formattedTime = format(new Date(item.startTime), "hh:mm:ss a");
	const foundSpeaker = speakers.find((s) => s.id === item.speakerId);
	const isUser = foundSpeaker?.isUser ?? false;
	const speakerTitle =
		item.speakerStatus === "processing"
			? "Processing..."
			: foundSpeaker?.name || "Unknown";

	return (
		<View
			className={twMerge(
				"mb-3 p-3.5 bg-secondary-system-background rounded-2xl mx-3 w-fit max-w-[80%] self-start",
				isUser && "self-end",
			)}
		>
			<Text className={twMerge("text-[15px] text-label")}>
				{item.transcript}
			</Text>
			{!isUser && (
				<Text className="text-sm text-tertiary-label italic">
					{speakerTitle}
				</Text>
			)}
		</View>
	);
};
