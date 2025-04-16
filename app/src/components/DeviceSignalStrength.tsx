import { SignalStrengthDynamicIcon } from "@/src/components/icons/SignalStrengthDynamicIcon";
import { useDeviceSignalStrength } from "@/src/hooks/useDeviceRssi";

export const DeviceSignalStrength = () => {
	const signalStrength = useDeviceSignalStrength();
	return <SignalStrengthDynamicIcon strength={signalStrength} />;
};
