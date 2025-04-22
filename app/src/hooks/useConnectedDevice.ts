import { deviceService } from "@/src/services/deviceService/deviceService";
import { use$ } from "@legendapp/state/react";

export const useConnectedDevice = () => {
	return use$(() =>
		deviceService.connectedDeviceId$.get()
			? deviceService.getConnectedDevice()
			: null,
	);
};
