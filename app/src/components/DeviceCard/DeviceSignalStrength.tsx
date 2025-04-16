import { SignalStrengthDynamicIcon } from "@/src/components/icons/SignalStrengthDynamicIcon";
import { useDeviceSignalStrength } from "@/src/hooks/useDeviceRssi";

type DeviceSignalStrengthProps = {
	size?: number;
};

export const DeviceSignalStrength = ({ size }: DeviceSignalStrengthProps) => {
	const signalStrength = useDeviceSignalStrength();
	return <SignalStrengthDynamicIcon strength={signalStrength} size={size} />;
};
