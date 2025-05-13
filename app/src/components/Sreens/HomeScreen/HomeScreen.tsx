import React, { useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";

import { DeviceStatusButton } from "@app/src/components/DeviceStatusButton";
import { ScreenScrollView } from "@app/src/components/ScreenScrollView/ScreenScrollView";
import { LiveTranscriptsWidget } from "@app/src/components/Sreens/HomeScreen/LiveTranscriptsWidget";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { Text } from "@app/src/components/ui/Text";
import { deviceService } from "@app/src/services/deviceService/deviceService";
import { liveAudioDataService } from "@app/src/services/liveAudioDataService/lifeAudioDataService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";

export const HomeScreen = () => {
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const shouldListen = use$(liveAudioDataService.shouldListen$);

	useEffect(() => {
		if (!connectedDeviceId) {
			return;
		}
		liveAudioDataService.startAudioCollection();
	}, [connectedDeviceId]);

	const handleToggleListening = () => {
		liveAudioDataService.toggleListening();
	};

	return (
		<ScreenScrollView.Container title="Life Recorder" className="pt-5 ">
			<View className="px-lg flex items-start gap-3 ">
				<View className=" w-full flex-row flex-1 justify-between items-end mb-4">
					<View className="flex items-start gap-3">
						<DeviceStatusButton />
						<ScreenScrollView.Title>
							<View className=" flex-row justify-between items-center w-full">
								<Text className="text-4xl font-extrabold text-label">
									Life Recorder
								</Text>
							</View>
						</ScreenScrollView.Title>
						<Button
							title={shouldListen ? "Stop Listening" : "Start Listening"}
							onPress={handleToggleListening}
						/>
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
			</View>
			<LiveTranscriptsWidget />
		</ScreenScrollView.Container>
	);
};
