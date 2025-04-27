import React from "react";

import { Text } from "@app/src/components/ui/Text";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { useLocalSearchParams } from "expo-router";

export const VoiceProfileScreen = () => {
	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();

	return (
		<>
			<Text className=" text-label text-2xl font-bold">
				Voice Profile {type}
			</Text>
		</>
	);
};
