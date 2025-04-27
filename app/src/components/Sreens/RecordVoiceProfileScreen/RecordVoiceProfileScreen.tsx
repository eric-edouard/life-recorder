import React, { useState } from "react";

import { BluetoothStatusInfo } from "@app/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { IconAndText } from "@app/src/components/ui/IconAndText";
import { Text } from "@app/src/components/ui/Text";
import {
	voiceProfilesLabel,
	voiceProfilesText,
} from "@app/src/constants/voiceProfilesText";
import { useCustomColor } from "@app/src/contexts/ThemeContext";
import { deviceService } from "@app/src/services/deviceService/deviceService";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { recordAudioDataService } from "@app/src/services/recordAudioDataService";
import { userService } from "@app/src/services/userService";
import { use$ } from "@legendapp/state/react";
import type { VoiceProfileType } from "@shared/sharedTypes";
import { toast } from "burnt";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { State } from "react-native-ble-plx";

export const RecordVoiceProfileScreen = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const permissionStatus = use$(scanDevicesService.permissionStatus$);
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const accent = useCustomColor("--accent");

	const isRecording = use$(recordAudioDataService.isRecording$);
	const bluetoothEnabled =
		bluetoothState === State.PoweredOn && permissionStatus === "granted";
	const deviceConnected = !!connectedDeviceId;
	const disabled = !bluetoothEnabled || !deviceConnected;

	return (
		<>
			<ScrollView contentContainerClassName="flex-1 px-5  flex items-center h-full">
				{disabled && (
					<View className="flex-1 items-center justify-center pb-20">
						{!bluetoothEnabled && <BluetoothStatusInfo />}
						{!deviceConnected && (
							<IconAndText
								title="Device not connected"
								message="Please connect to a device to record a voice profile"
								icon={
									<SymbolView
										name="microphone"
										type="hierarchical"
										tintColor={"gray"}
										size={64}
									/>
								}
							/>
						)}
					</View>
				)}

				{!disabled && (
					<View className="flex-1 items-start w-full gap-8 pt-12 ">
						<Text className="text-label  text-3xl font-bold mx-2 ">
							{voiceProfilesLabel[type]} pitch
						</Text>
						<Text className="text-label text-3xl leading-relaxed font-light mx-2 ">
							{voiceProfilesText[type]}
						</Text>
						{isLoading && <ActivityIndicator size={"large"} color={"black"} />}
					</View>
				)}
			</ScrollView>
			{!disabled && (
				<View className="absolute bottom-safe-offset-20 w-full flex justify-center items-center">
					<Button
						icon={
							<SymbolView
								name="record.circle"
								type="hierarchical"
								tintColor={accent}
								// type="palette"
								// colors={[accent, accent]}
								// animationSpec={{
								// 	effect: {
								// 		type: "bounce",
								// 	},
								// 	repeating: true,
								// 	speed: 0.5,
								// }}
							/>
						}
						color="secondarySystemBackground"
						textColor="secondaryLabel"
						title={isRecording ? "Stop recording" : "Start recording"}
						onPress={async () => {
							if (!isRecording) {
								await userService.startRecordingVoiceProfile();
							} else {
								setIsLoading(true);
								try {
									const result =
										await userService.createVoiceProfileFromRecording(type);
									if (!result) {
										toast({
											preset: "error",
											title: "Failed to start recording",
											message: "Please try again",
										});
									}
								} catch (error) {
									console.error(error);
									toast({
										preset: "error",
										title: "Failed to start recording",
										message: "Please try again",
									});
								} finally {
									setIsLoading(false);
								}
							}
						}}
					/>
				</View>
			)}
		</>
	);
};
