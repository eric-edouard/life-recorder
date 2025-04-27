import React from "react";

import { AudioPlayer } from "@app/src/components/AudioPlayer";
import { trpcQuery } from "@app/src/services/trpc";
import { userService } from "@app/src/services/userService";
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

	return (
		<View className="flex-1 ">
			{isLoading && <ActivityIndicator size="large" color="#0000ff" />}
			{/* {fileUrl && <Text>File URL: {fileUrl}</Text>} */}
			{fileUrl && <AudioPlayer title="test" fileUrl={fileUrl} />}
		</View>
	);
};
