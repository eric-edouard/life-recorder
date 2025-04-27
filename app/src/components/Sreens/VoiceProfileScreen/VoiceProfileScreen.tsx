import React from "react";

import { AudioPlayer } from "@app/src/components/AudioPlayer";
import { voiceProfilesLabel } from "@app/src/constants/voiceProfilesText";
import { trpcQuery } from "@app/src/services/trpc";
import { userService } from "@app/src/services/userService";
import { extractDataFromFileName } from "@app/src/utils/extractDataFromFileName";
import { use$ } from "@legendapp/state/react";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export const VoiceProfileScreen = () => {
	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();
	const voiceProfile = use$(userService.voiceProfiles$)?.[type];
	console.log("🚀 ~ VoiceProfileScreen ~ voiceProfile:", voiceProfile);

	const { data: fileUrl, isLoading } = useQuery(
		trpcQuery.fileUrl.queryOptions(voiceProfile?.fileId!, {
			enabled: !!voiceProfile?.fileId,
		}),
	);

	const { date, durationSeconds } = voiceProfile?.fileId
		? extractDataFromFileName(voiceProfile?.fileId)
		: { date: new Date(), durationSeconds: undefined };

	return (
		<View className="flex-1 ">
			{isLoading && <ActivityIndicator size="large" color="#0000ff" />}
			{/* {fileUrl && <Text>File URL: {fileUrl}</Text>} */}
			{fileUrl && (
				<AudioPlayer
					title={`${voiceProfilesLabel[type]} Voice`}
					fileUrl={fileUrl}
					date={date}
					duration={durationSeconds ?? 0}
				/>
			)}
		</View>
	);
};
