import React from "react";

import { Text } from "@app/src/components/ui/Text";
import { userService } from "@app/src/services/userService";
import { use$ } from "@legendapp/state/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

export const RecordVoiceProfileScreen = () => {
	const { type } = useLocalSearchParams<{
		type: "normal" | "slow-deep" | "fast-high";
	}>();
	const voiceProfiles = use$(userService.voiceProfiles$);
	const router = useRouter();
	return (
		<ScrollView className="flex-1 px-5 pt-10">
			<Text>Record {type} voice profile</Text>
		</ScrollView>
	);
};
