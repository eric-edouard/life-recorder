import { useConnectedDevice } from "@/src/hooks/useConnectedDevice";
import { defer } from "@/src/utils/defer";
import {
	type DragChangeEvent,
	type SizeChangeEvent,
	TrueSheet,
} from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useColor } from "react-native-uikit-colors";

import {
	DEVICE_SHEET_HEIGHT,
	dragValue$,
} from "@/src/components/Sreens/DeviceBottomSheet/ConnectedDeviceDetails";
import { DeviceBottomSheetStateRouter } from "@/src/components/Sreens/DeviceBottomSheet/DeviceBottomSheetStateRouter";

export function DeviceBottomSheet() {
	const connectedDevice = useConnectedDevice();
	const isInitialRender = useRef(true);

	const sheet = useRef<TrueSheet>(null);
	const backgroundColor = useColor("secondarySystemBackground");

	useEffect(() => {
		if (connectedDevice && !isInitialRender.current) {
			defer(() => sheet.current?.present(0));
		}
		isInitialRender.current = false;
	}, [connectedDevice]);

	return (
		<TrueSheet
			backgroundColor={backgroundColor}
			ref={sheet}
			sizes={connectedDevice ? [DEVICE_SHEET_HEIGHT, "auto"] : ["auto"]}
			cornerRadius={24}
			initialIndex={0}
			initialIndexAnimated={true}
			onDismiss={router.back}
			onDragChange={(sizeInfo: DragChangeEvent) => {
				dragValue$.set(sizeInfo.nativeEvent.value);
			}}
			onSizeChange={(event: SizeChangeEvent) => {
				dragValue$.set(event.nativeEvent.value);
			}}
		>
			<DeviceBottomSheetStateRouter />
		</TrueSheet>
	);
}
