import { useAppState } from "@app/hooks/useAppState";
import { deviceService } from "@app/services/deviceService/deviceService";
import type { SignalStrength } from "@app/utils/rssiToSignalStrength";
import { rssiToSignalStrength } from "@app/utils/rssiToSignalStrength";

import { use$ } from "@legendapp/state/react";
import { useEffect, useState } from "react";

export const useDeviceSignalStrength = () => {
	const appState = useAppState();
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const [signalStrength, setSignalStrength] = useState<SignalStrength | null>(
		null,
	);

	// Fetch battery level
	const fetchRssi = async () => {
		if (connectedDeviceId) {
			try {
				const rssi = await deviceService.getConnectedDeviceRssi();
				if (rssi) {
					setSignalStrength(rssiToSignalStrength(rssi));
				}
			} catch (error) {
				console.error("Error fetching battery level:", error);
			}
		} else {
			setSignalStrength(null);
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
				setSignalStrength(null);
			};
		}
	}, [connectedDeviceId, appState]);

	return signalStrength;
};
