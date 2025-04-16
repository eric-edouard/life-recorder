import { useAppState } from "@/src/hooks/useAppState";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$, useObservable } from "@legendapp/state/react";
import { useEffect } from "react";

export const useDeviceRssi = () => {
	const appState = useAppState();
	const rssi$ = useObservable<number | null>(null);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);

	// Fetch battery level
	const fetchRssi = async () => {
		if (connectedDeviceId) {
			try {
				const rssi = await omiDeviceManager.getConnectedDeviceRssi();
				console.log(">>>> Refresshed rssi", rssi);
				if (rssi) {
					rssi$.set(rssi);
				}
			} catch (error) {
				console.error("Error fetching battery level:", error);
			}
		} else {
			rssi$.set(null);
		}
	};

	useEffect(() => {
		if (connectedDeviceId && appState === "active") {
			// Fetch immediately when connected
			fetchRssi();

			// Set up interval to fetch every 30 seconds
			const intervalId = setInterval(fetchRssi, 5000);

			// Clean up interval when disconnected or component unmounts
			return () => {
				clearInterval(intervalId);
				rssi$.set(null);
			};
		}
	}, [connectedDeviceId, appState]);

	return rssi$;
};
