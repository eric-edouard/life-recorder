import { VoiceProfileScreen } from "@app/src/components/Sreens/VoiceProfileScreen/VoiceProfileScreen";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import React from "react";
import { useColor } from "react-native-uikit-colors";

export default function VoiceProfileModal() {
	const backgroundColor = useColor("secondarySystemBackground");

	return (
		<TrueSheet
			backgroundColor={backgroundColor}
			sizes={["auto"]}
			cornerRadius={24}
			initialIndex={0}
			initialIndexAnimated={true}
			onDismiss={router.back}
		>
			<VoiceProfileScreen />
		</TrueSheet>
	);
}
