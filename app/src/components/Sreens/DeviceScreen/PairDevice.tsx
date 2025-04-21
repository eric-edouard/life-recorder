import { SearchingDevices } from "@/src/components/Sreens/DeviceScreen/SearchingDevices";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { matchId } from "@/src/utils/matchId";
import { use$ } from "@legendapp/state/react";
import React from "react";
import { View } from "react-native";
import { Text } from "../../ui/Text";

export function PairDevice() {
	const compatibleDeviceId = use$(scanDevicesService.compatibleDeviceId$);
	const compatibleDevice = use$(() =>
		compatibleDeviceId
			? scanDevicesService.devices$.get().find(matchId(compatibleDeviceId))
			: undefined,
	);

	if (!compatibleDevice) return <SearchingDevices />;

	return (
		<View>
			<Text>{compatibleDevice?.name}</Text>
		</View>
	);
}
