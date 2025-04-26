import React from "react";

import { BluetoothStatusInfo } from "@app/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { Text } from "@app/src/components/ui/Text";
import {
	voiceProfilesLabel,
	voiceProfilesText,
} from "@app/src/constants/voiceProfilesText";
import { useCustomColor } from "@app/src/contexts/ThemeContext";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import type { VoiceProfileType } from "@backend/src/types/VoiceProfileType";
import { use$ } from "@legendapp/state/react";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ScrollView, View } from "react-native";
import { State } from "react-native-ble-plx";

export const RecordVoiceProfileScreen = () => {
	const { type } = useLocalSearchParams<{ type: VoiceProfileType }>();
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const permissionStatus = use$(scanDevicesService.permissionStatus$);

	const disabled =
		bluetoothState !== State.PoweredOn || permissionStatus !== "granted";

	const accent = useCustomColor("--accent");

	return (
		<>
			<ScrollView contentContainerClassName="flex-1 px-5  flex items-center h-full">
				{disabled && <BluetoothStatusInfo />}
				{!disabled && (
					<View className="flex-1 items-start w-full gap-8 pt-12 ">
						<Text className="text-label  text-3xl font-bold mx-2 ">
							{voiceProfilesLabel[type]} Voice
						</Text>
						<Text className="text-label text-3xl leading-relaxed font-light mx-2 ">
							{voiceProfilesText[type]}
						</Text>
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
						title="Start recording"
						onPress={() => {}}
					/>
				</View>
			)}
		</>
	);
};
