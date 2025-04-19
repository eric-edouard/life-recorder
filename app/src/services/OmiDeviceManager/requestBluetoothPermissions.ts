import { Alert } from "react-native";

import { Linking } from "react-native";
import type { BleManager } from "react-native-ble-plx";

export const requestBluetoothPermissions = (
	_bleManager: BleManager,
	setPermissionsGranted: (granted: boolean) => void,
) => {
	try {
		_bleManager.startDeviceScan(null, null, (error) => {
			if (error) {
				console.error("Permission error:", error);
				setPermissionsGranted(false);
				Alert.alert(
					"Bluetooth Permission",
					"Please enable Bluetooth permission in your device settings to use this feature.",
					[
						{ text: "Cancel", style: "cancel" },
						{
							text: "Open Settings",
							onPress: () => Linking.openSettings(),
						},
					],
				);
			} else {
				setPermissionsGranted(true);
			}
			// Stop scanning immediately after permission check
			_bleManager.stopDeviceScan();
		});
	} catch (error) {
		console.error("Error in requestBluetoothPermissions:", error);
		setPermissionsGranted(false);
	}
};
