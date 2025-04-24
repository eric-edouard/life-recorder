import React, { useEffect } from "react";
import { Image, View } from "react-native";

import { DeviceStatusButton } from "@app/components/DeviceStatusButton";
import { ScreenScrollView } from "@app/components/ScreenScrollView/ScreenScrollView";
import { Button } from "@app/components/ui/Buttons/Button";
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
			<View className="px-lg flex items-start gap-3">
				<ScreenScrollView.Title>
					<View className=" w-full flex-row flex-1 justify-between items-end mb-4">
						<View className="flex items-start gap-3">
							<DeviceStatusButton />
							<View className=" flex-row justify-between items-center w-full">
								<Text className="text-4xl font-extrabold text-label">
									Life Recorder
								</Text>
							</View>
						</View>
						<Image
							source={{
								uri: "https://ng0taspu2n.ufs.sh/f/U6TZ1KbvcdmTGQifCw2ULDWxUQCZ2BsqE7bVmwygO0Y3f6vz",
							}}
							className="w-10 h-10 rounded-full mb-1"
						/>
					</View>
				</ScreenScrollView.Title>
			</View>
			<View className=" relative flex items-center justify-center">
				<Button title="Test" onPress={() => {}} />
			</View>
		</ScreenScrollView.Container>
	);
};
