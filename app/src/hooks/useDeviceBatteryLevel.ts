import { useAppState } from "@/src/hooks/useAppState";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";
import { useEffect, useState } from "react";

export const useDeviceBatteryLevel = () => {
	const appState = useAppState();

	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);

	// Fetch battery level
	const fetchBatteryLevel = async () => {
		if (connectedDeviceId) {
			try {
				const level = await deviceService.getBatteryLevel();
				if (level >= 0) {
					setBatteryLevel(level);
				}
			} catch (error) {
				console.error("Error fetching battery level:", error);
			}
		} else {
			setBatteryLevel(null);
		}
	};

	// Fetch battery level when connected and every 30 seconds
	useEffect(() => {
		if (connectedDeviceId && appState === "active") {
			// Fetch immediately when connected
			fetchBatteryLevel();

			// Set up interval to fetch every 30 seconds
			const intervalId = setInterval(fetchBatteryLevel, 30000);

			// Clean up interval when disconnected or component unmounts
			return () => {
				clearInterval(intervalId);
				setBatteryLevel(null);
			};
		}
	}, [connectedDeviceId, appState]);

	return batteryLevel;
};
