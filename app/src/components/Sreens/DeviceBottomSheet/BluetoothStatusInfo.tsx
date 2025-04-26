import { Button } from "@app/src/components/ui/Buttons/Button";
import { IconAndText } from "@app/src/components/ui/IconAndText";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { Bluetooth, BluetoothOff } from "lucide-react-native";
import React from "react";
import { Linking } from "react-native";
import { State } from "react-native-ble-plx";
import { useColor } from "react-native-uikit-colors";

export function BluetoothStatusInfo() {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const permissionStatus = use$(scanDevicesService.permissionStatus$);
	const gray2 = useColor("gray2");

	const canAskForPermission = permissionStatus !== "denied";

	if (permissionStatus !== "granted") {
		return (
			<IconAndText
				className="m-5 mb-safe-offset-2"
				icon={<Bluetooth size={56} color={gray2} />}
				title="Missing Permissions"
				message={
					canAskForPermission
						? "Please enable Bluetooth permission to connect to your device"
						: "Please enable Bluetooth permission in your settings to connect to your device"
				}
				content={
					<Button
						style={{
							marginTop: 8,
							padding: 32,
						}}
						onPress={() => {
							if (canAskForPermission) {
								scanDevicesService.requestBluetoothPermission();
							} else {
								Linking.openSettings();
							}
						}}
						title={canAskForPermission ? "Enable Bluetooth" : "Go to settings"}
					/>
				}
			/>
		);
	}

	if (bluetoothState !== State.PoweredOn) {
		return (
			<IconAndText
				className="m-5 mb-safe-offset-5"
				icon={<BluetoothOff size={56} color={gray2} />}
				title="Bluetooth is off"
				message="Please enable Bluetooth to connect to your device"
			/>
		);
	}

	return null;
}
