import React from "react";

import { BluetoothStatusInfo } from "@app/src/components/Sreens/DeviceBottomSheet/BluetoothStatusInfo";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import { ScrollView } from "react-native";
import { State } from "react-native-ble-plx";

export const RecordVoiceProfileScreen = () => {
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const permissionStatus = use$(scanDevicesService.permissionStatus$);

	const disabled =
		bluetoothState !== State.PoweredOn || permissionStatus !== "granted";

	return (
		<ScrollView className="flex-1 px-5 pt-10">
			{disabled && <BluetoothStatusInfo />}
			{!disabled && <Button title="Start recording" onPress={() => {}} />}
		</ScrollView>
	);
};
