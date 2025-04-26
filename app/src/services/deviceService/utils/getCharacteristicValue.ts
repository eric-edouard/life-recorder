import { extractFirstByteValue } from "@app/src/services/deviceService/utils/extractFirstByteValue";
import { getDeviceCharacteristic } from "@app/src/services/deviceService/utils/getDeviceCharacteric";
import type { Device } from "react-native-ble-plx";

export const getCharacteristicValue = async (
	device: Device,
	serviceUuid: string,
	characteristicUuid: string,
) => {
	const characteristic = await getDeviceCharacteristic(
		device,
		serviceUuid,
		characteristicUuid,
	);
	if (!characteristic) {
		throw new Error("[getCharacteristicValue] Characteristic not found");
	}
	const value = extractFirstByteValue((await characteristic.read()).value);
	if (!value) {
		throw new Error("[getCharacteristicValue] No value found");
	}
	return value;
};
