import { AnimatedBluetoothScanning } from "@/src/components/Sreens/DeviceBottomSheet/AnimatedBluetoothScanning";
import { IconAndText } from "@/src/components/ui/IconAndText";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { alert } from "@/src/services/deviceService/utils/alert";
import { storage$ } from "@/src/services/storage";
import { Button } from "@expo/ui/swift-ui";
import { use$ } from "@legendapp/state/react";
import React from "react";
import { View } from "react-native";

export function SearchingYourDevice() {
	const pairedDevice = use$(storage$.pairedDevice);
	return (
		<View className="flex-1 items-center justify-center mb-safe-offset-2 pt-14 pb-10 ">
			<IconAndText
				className="mt-2"
				icon={<AnimatedBluetoothScanning />}
				title={`Searching for ${pairedDevice?.name}`}
				message="It will connect automatically once found"
			/>
			<Button
				variant="bordered"
				onPress={() =>
					alert({
						title: `Unpair`,
						message: `Disconnect from ${pairedDevice?.name}?`,
						buttons: [
							{
								text: "Cancel",
								style: "cancel",
							},
							{
								text: "Unpair",
								style: "destructive",
								onPress: () => {
									deviceService.unpairDevice();
								},
							},
						],
					})
				}
				color="gray"
			>
				Unpair this device
			</Button>
		</View>
	);
}
