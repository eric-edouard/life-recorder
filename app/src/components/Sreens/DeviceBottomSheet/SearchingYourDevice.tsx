import { AnimatedBluetoothScanning } from "@/src/components/Sreens/DeviceBottomSheet/AnimatedBluetoothScanning";
import { IconAndText } from "@/src/components/ui/IconAndText";
import { storage$ } from "@/src/services/storage";
import { Button } from "@expo/ui/swift-ui";
import React from "react";
import { View } from "react-native";

export function SearchingYourDevice() {
	return (
		<View className="flex-1 items-center justify-center mb-safe-offset-2 pt-14 pb-10 ">
			<IconAndText
				className="mt-2"
				icon={<AnimatedBluetoothScanning />}
				title="Searching..."
				message="Looking for your device"
			/>
			<Button
				variant="bordered"
				onPress={() => {
					alert({
						title: `Unpair`,
						message: `Disconnect from your device?`,
						buttons: [
							{
								text: "Cancel",
								style: "cancel",
							},
							{
								text: "Unpair",
								style: "destructive",
								onPress: () => {
									storage$.pairedDeviceId.set(null);
								},
							},
						],
					});
				}}
				color="gray"
			>
				Unpair my device
			</Button>
		</View>
	);
}
