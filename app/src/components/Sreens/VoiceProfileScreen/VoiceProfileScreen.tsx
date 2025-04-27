import React from "react";

import { Text } from "@app/src/components/ui/Text";
import { trpcQuery } from "@app/src/services/trpc";
import { userService } from "@app/src/services/userService";
import { use$ } from "@legendapp/state/react";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

export const VoiceProfileScreen = () => {
	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();
	const voiceProfile = use$(userService.voiceProfiles$)?.[type];
	console.log("🚀 ~ VoiceProfileScreen ~ voiceProfile:", voiceProfile);

	const { data, isLoading } = useQuery(
		trpcQuery.fileUrl.queryOptions(voiceProfile?.fileId!, {
			enabled: !!voiceProfile?.fileId,
		}),
	);

	return (
		<>
			<Text className="text-label text-2xl font-bold">
				Voice Profile {type}
			</Text>
			{data && (
				<Text className="text-label text-2xl font-bold">File URL: {data}</Text>
			)}
		</>
	);
};
