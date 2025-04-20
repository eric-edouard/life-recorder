import { matchUuid } from "@/src/utils/matchUUID";
import type { Characteristic, Device } from "react-native-ble-plx";

export const getDeviceCharacteristic = async (
	device: Device,
	serviceUuid: string,
	characteristicUuid: string,
): Promise<Characteristic | undefined> => {
	const services = await device.services();
	const service = services.find(matchUuid(serviceUuid));
	if (!service) return;

	const characteristics = await service.characteristics();
	const characteristic = characteristics.find(matchUuid(characteristicUuid));

	return characteristic;
};
