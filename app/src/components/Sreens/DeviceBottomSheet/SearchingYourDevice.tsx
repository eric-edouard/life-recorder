import { AnimatedBluetoothScanning } from "@app/src/components/Sreens/DeviceBottomSheet/AnimatedBluetoothScanning";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { IconAndText } from "@app/src/components/ui/IconAndText";
import { deviceService } from "@app/src/services/deviceService/deviceService";
import { storage$ } from "@app/src/services/storage";
import { alert } from "@app/src/utils/alert";
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
				title="Unpair this device"
				color="gray4"
				textColor="secondaryLabel"
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
			/>
		</View>
	);
}
