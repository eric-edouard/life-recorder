import { useAppState } from "@/src/hooks/useAppState";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$, useObservable } from "@legendapp/state/react";
import { useEffect } from "react";

export const useDeviceBatteryLevel = () => {
	const appState = useAppState();

	const batteryLevel$ = useObservable<number | null>(null);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);

	// Fetch battery level
	const fetchBatteryLevel = async () => {
		if (connectedDeviceId) {
			try {
				const level = await omiDeviceManager.getBatteryLevel();
				if (level >= 0) {
					batteryLevel$.set(level);
				}
			} catch (error) {
				console.error("Error fetching battery level:", error);
			}
		} else {
			batteryLevel$.set(null);
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
				batteryLevel$.set(null);
			};
		}
	}, [connectedDeviceId, appState]);

	return batteryLevel$;
};
