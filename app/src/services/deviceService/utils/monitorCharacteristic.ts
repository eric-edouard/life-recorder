import { extractFirstByteValue } from "@app/services/deviceService/utils/extractFirstByteValue";
import { getDeviceCharacteristic } from "@app/services/deviceService/utils/getDeviceCharacteric";
import type { Subscription } from "react-native-ble-plx";

import type { Device } from "react-native-ble-plx";

export const monitorCharacteristic = async (
	device: Device,
	serviceUuid: string,
	characteristicUuid: string,
	setter: (value: number) => void,
): Promise<Subscription> => {
	const subscription = device.monitorCharacteristicForService(
		serviceUuid,
		characteristicUuid,
		(error, characteristic) => {
			if (error) {
				if (error.message === "Operation was cancelled") {
					console.log("[monitorCharacteristic] Operation was cancelled");
					return;
				}
				if (error.message.includes(" was disconnected")) {
					console.log("[monitorCharacteristic] Device was disconnected");
					return;
				}
				console.error("[monitorCharacteristic] Characteristic error:", {
					error,
					characteristicUuid,
					serviceUuid,
				});
				return;
			}
			const value = extractFirstByteValue(characteristic?.value);
			if (!value) {
				console.error(
					"[monitorCharacteristic] Received notification but no characteristic value",
					{
						characteristicUuid,
						serviceUuid,
					},
				);
				return;
			}
			setter(value);
		},
	);
	// Get the initial value
	const characteristic = await getDeviceCharacteristic(
		device,
		serviceUuid,
		characteristicUuid,
	);
	if (!characteristic) {
		throw new Error("[monitorCharacteristic] Characteristic not found");
	}
	const initialValue = extractFirstByteValue(
		(await characteristic.read()).value,
	);
	if (!initialValue) {
		throw new Error("[monitorCharacteristic] No initialValue found");
	}
	setter(initialValue);
	return subscription;
};
