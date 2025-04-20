import { matchUuid } from "@/src/utils/matchUUID";
import type { Device } from "react-native-ble-plx";
import { base64ToBytes } from "../../utils/base64ToBytes";
import {
	BATTERY_LEVEL_CHARACTERISTIC_UUID,
	BATTERY_SERVICE_UUID,
} from "./constants";

export async function monitorBatteryLevel(
	device: Device,
	onLevel: (level: number) => void,
) {
	const services = await device.services();
	const batteryService = services.find(matchUuid(BATTERY_SERVICE_UUID));
	if (!batteryService) return;

	const characteristics = await batteryService.characteristics();
	const levelChar = characteristics.find(
		matchUuid(BATTERY_LEVEL_CHARACTERISTIC_UUID),
	);
	if (!levelChar) return;

	levelChar.monitor((err, char) => {
		if (err || !char?.value) return;
		const bytes = base64ToBytes(char.value);
		if (bytes.length > 0) onLevel(bytes[0]);
	});
}
