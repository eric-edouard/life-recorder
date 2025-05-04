import { PressableLayer } from "@app/src/components/PressableLayer";
import type { LiveUtterance } from "@app/src/services/liveTranscriptionService";
import type { Speaker } from "@app/src/services/speakersService";
import { format } from "date-fns";
import { router } from "expo-router";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Text } from "./ui/Text";

export const LiveUtteranceItem = ({
	item,
	speakers,
}: {
	item: LiveUtterance;
	speakers: Speaker[];
}) => {
	const formattedTime = format(
		new Date(item.speechStart),
		"EEEE d MMM - HH:mm:ss",
	);
	const foundSpeaker = speakers.find((s) => s.id === item.speakerId);
	const isUser = foundSpeaker?.isUser ?? false;
	const speakerTitle =
		item.speakerStatus === "processing"
			? "Processing..."
			: foundSpeaker?.name || "Unknown";

	return (
		<PressableLayer
			onPress={() => {
				router.push(`/modals/utterance?utteranceId=${item.utteranceId}`);
				// `/modals/assign-voice-profile-speaker?voiceProfileId=${item.voiceProfileId}`,
			}}
			className={twMerge(
				"mb-3 p-3.5 bg-secondary-system-background rounded-2xl mx-3 w-fit max-w-[80%] self-start",
				isUser && "self-end",
			)}
		>
			<Text className={twMerge("text-[15px] text-label")}>
				{item.transcript}
			</Text>
			<Text className="text-sm text-tertiary-label italic">
				{formattedTime}
			</Text>
			{!isUser && (
				<Text className="text-sm text-tertiary-label italic">
					{speakerTitle}
				</Text>
			)}
		</PressableLayer>
	);
};
