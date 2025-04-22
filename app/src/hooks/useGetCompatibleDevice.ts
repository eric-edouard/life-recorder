import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";

export const useGetCompatibleDevice = () => {
	const compatibleDeviceId = use$(scanDevicesService.compatibleDeviceId$);
	const compatibleDevice = compatibleDeviceId
		? scanDevicesService.getCompatibleDevice()
		: null;
	return compatibleDevice;
};
