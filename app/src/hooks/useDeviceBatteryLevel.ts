import { deviceService } from "@/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";
import { useEffect, useRef, useState } from "react";
import type { Subscription } from "react-native-ble-plx";
export const useDeviceBatteryLevel = () => {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const subscription = useRef<Subscription | null>(null);

	const monitorBatteryLevel = async () => {
		try {
			subscription.current =
				await deviceService.monitorBatteryLevel(setBatteryLevel);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (connectedDeviceId) {
			monitorBatteryLevel();
			return () => {
				subscription.current?.remove();
				setBatteryLevel(null);
			};
		}
	}, [connectedDeviceId]);

	return batteryLevel;
};
