import { Card } from "@app/src/components/Card";
import { DeviceBatteryLevel } from "@app/src/components/DeviceCard/DeviceBatteryLevel";
import { DeviceConnectionStatus } from "@app/src/components/DeviceCard/DeviceConnectionStatus";
import { DeviceNameAndSignal } from "@app/src/components/DeviceCard/DeviceNameAndSignal";
import React from "react";
import { View } from "react-native";
import { Text } from "../ui/Text";

type DeviceCardProps = {
	onPress: () => void;
};

export const DeviceCard = ({ onPress }: DeviceCardProps) => {
	return (
		<Card
			onPress={onPress}
			containerClassName="flex-1"
			className="flex-1 flex-col justify-between gap-2 "
		>
			<View className="flex-row items-center justify-between mb-1">
				<Text className="font-semibold text-label text-lg ">
					Recording Device
				</Text>
			</View>
			<DeviceConnectionStatus />
			<DeviceNameAndSignal />
			<DeviceBatteryLevel />
		</Card>
	);
};
