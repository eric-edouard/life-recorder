import { useDeviceSignalStrength } from "@app/hooks/useDeviceRssi";

type DeviceSignalStrengthProps = {
	size?: number;
};

export const DeviceSignalStrength = ({ size }: DeviceSignalStrengthProps) => {
	const signalStrength = useDeviceSignalStrength();
	return null;
};
