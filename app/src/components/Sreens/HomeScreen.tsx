import React, { useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";

import { DeviceStatusButton } from "@app/src/components/DeviceStatusButton";
import { ScreenScrollView } from "@app/src/components/ScreenScrollView/ScreenScrollView";
import { Text } from "@app/src/components/ui/Text";
import { deviceService } from "@app/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";

export const HomeScreen = () => {
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);

	useEffect(() => {
		if (!connectedDeviceId) {
			return;
		}
		// liveAudioDataService.startAudioCollection();
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
						<TouchableOpacity
							onPress={() => {
								router.push("/user");
							}}
						>
							<Image
								source={{
									uri: "https://ng0taspu2n.ufs.sh/f/U6TZ1KbvcdmTGQifCw2ULDWxUQCZ2BsqE7bVmwygO0Y3f6vz",
								}}
								className="w-10 h-10 rounded-full mb-1"
							/>
						</TouchableOpacity>
					</View>
				</ScreenScrollView.Title>
			</View>
		</ScreenScrollView.Container>
	);
};
