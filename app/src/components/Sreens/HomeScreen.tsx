import React, { useEffect } from "react";
import { View } from "react-native";

import { DeviceStatusButton } from "@app/components/DeviceStatusButton";
import { ScreenScrollView } from "@app/components/ScreenScrollView/ScreenScrollView";
import { Text } from "@app/components/ui/Text";
import { deviceService } from "@app/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";

export const HomeScreen = () => {
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);

	useEffect(() => {
		if (!connectedDeviceId) {
			return;
		}
		// audioDataService.startAudioCollection();
	}, [connectedDeviceId]);

	return (
		<ScreenScrollView.Container title="Life Recorder" className="pt-5">
			<View className="px-lg w-full flex items-start gap-3">
				<ScreenScrollView.Title>
					<View className="flex items-start gap-3">
						<DeviceStatusButton />
						<Text className="text-3xl font-extrabold mb-4 text-label">
							Life Recorder
						</Text>
					</View>
				</ScreenScrollView.Title>
			</View>
		</ScreenScrollView.Container>
	);
};
