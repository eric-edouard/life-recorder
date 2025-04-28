import { VoiceProfileScreen } from "@app/src/components/Sreens/VoiceProfileScreen/VoiceProfileScreen";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import { useColor } from "react-native-uikit-colors";

export default function VoiceProfileModal() {
	const backgroundColor = useColor("secondarySystemBackground");
	const sheet = useRef<TrueSheet>(null);

	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();
	return (
		<TrueSheet
			ref={sheet}
			backgroundColor={backgroundColor}
			sizes={["auto"]}
			cornerRadius={24}
			initialIndex={0}
			initialIndexAnimated={true}
			onDismiss={router.back}
		>
			<VoiceProfileScreen
				type={type}
				closeModal={() => {
					sheet.current?.dismiss();
				}}
			/>
		</TrueSheet>
	);
}
