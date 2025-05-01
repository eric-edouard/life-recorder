import { RecordVoiceProfileScreen } from "@app/src/components/Sreens/RecordVoiceProfileScreen/RecordVoiceProfileScreen";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { useColor } from "react-native-uikit-colors";

export default function RecordVoiceProfileModal() {
	const backgroundColor = useColor("secondarySystemBackground");
	const sheet = useRef<TrueSheet>(null);
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
			<RecordVoiceProfileScreen
				closeModal={() => {
					sheet.current?.dismiss();
				}}
			/>
		</TrueSheet>
	);
}
