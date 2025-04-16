import { Card } from "@/src/components/Card";
import { DeviceBatteryLevel } from "@/src/components/DeviceCard/DeviceBatteryLevel";
import { DeviceConnectionStatus } from "@/src/components/DeviceCard/DeviceConnectionStatus";
import { DeviceSignalStrength } from "@/src/components/DeviceCard/DeviceSignalStrength";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$ } from "@legendapp/state/react";
import React from "react";
import { View } from "react-native";
import { Text } from "../Text";

type DeviceCardProps = {
	onPress: () => void;
};

export const DeviceCard = ({ onPress }: DeviceCardProps) => {
	const connectedDevice = use$(
		omiDeviceManager.devices$
			.get()
			.find((d) => d.id === omiDeviceManager.connectedDeviceId$.get()),
	);

	return (
		<Card
			onPress={onPress}
			containerClassName="flex-1"
			className="flex-1 h-28 flex-col justify-between "
		>
			<View className="flex-row items-center justify-between relative ">
				<DeviceConnectionStatus />
				<DeviceSignalStrength />
			</View>
			<View className="flex-row items-center justify-between relative ">
				<Text className="text-base font-semibold text-foreground-level-3">
					{connectedDevice?.name ?? "No device connected"}
				</Text>
				<DeviceBatteryLevel />
			</View>
		</Card>
	);
};
