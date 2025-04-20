import { matchUuid } from "@/src/utils/matchUUID";
import type { Device } from "react-native-ble-plx";
import { base64ToBytes } from "../../utils/base64ToBytes";
import {
	BATTERY_LEVEL_CHARACTERISTIC_UUID,
	BATTERY_SERVICE_UUID,
} from "./constants";

export async function getBatteryLevel(device: Device) {
	const services = await device.services();
	const batteryService = services.find(matchUuid(BATTERY_SERVICE_UUID));
	if (!batteryService) return null;

	const characteristics = await batteryService.characteristics();
	const levelChar = characteristics.find(
		matchUuid(BATTERY_LEVEL_CHARACTERISTIC_UUID),
	);

	if (!levelChar) return null;

	const base64Value = (await levelChar.read()).value;

	if (base64Value) {
		const bytes = base64ToBytes(base64Value);
		if (bytes.length > 0) {
			return bytes[0] || null;
		}
	}
	return null;
}
