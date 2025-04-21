import { DeviceBottomSheet } from "@/src/components/Sreens/DeviceScreen/DeviceBottomSheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { useColor } from "react-native-uikit-colors";

export default function DeviceModal() {
	const sheet = useRef<TrueSheet>(null);
	const backgroundColor = useColor("secondarySystemBackground");

	return (
		<TrueSheet
			backgroundColor={backgroundColor}
			ref={sheet}
			sizes={["auto"]}
			cornerRadius={24}
			initialIndex={0}
			initialIndexAnimated={true}
			onDismiss={router.back}
		>
			<DeviceBottomSheet />
		</TrueSheet>
	);
}
