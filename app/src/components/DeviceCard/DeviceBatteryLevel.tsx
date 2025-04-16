import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import React from "react";
import { Text } from "../Text";

export const DeviceBatteryLevel = () => {
	const batteryLevel = useDeviceBatteryLevel();

	return batteryLevel !== null ? (
		<Text className="text-sm font-medium text-foreground-subtle">
			{batteryLevel}%
		</Text>
	) : null;
};
