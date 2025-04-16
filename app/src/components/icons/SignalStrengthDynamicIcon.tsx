import type { ColorName } from "@/src/constants/colorThemes";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { SignalStrength } from "@/src/utils/rssiToSignalStrength";
import { Wifi, WifiHigh, WifiLow, WifiZero } from "lucide-react-native";
import type React from "react";
import { View } from "react-native";

const SIGNAL_CONFIG: Record<
	SignalStrength | "unknown",
	{ icon: React.ElementType; color: ColorName }
> = {
	excellent: { icon: Wifi, color: "--green" },
	good: { icon: WifiHigh, color: "--green" },
	moderate: { icon: WifiLow, color: "--yellow" },
	poor: { icon: WifiZero, color: "--red" },
	unknown: { icon: Wifi, color: "--foreground" }, // Default case
};

type SignalStrengthDynamicIconProps = {
	strength: SignalStrength | null;
	size?: number;
};

export const SignalStrengthDynamicIcon = ({
	strength,
	size = 16,
}: SignalStrengthDynamicIconProps) => {
	const colors = useThemeColors();
	const config = strength ? SIGNAL_CONFIG[strength] : SIGNAL_CONFIG.unknown;
	const SignalIcon = config.icon;

	return (
		<View className="" style={{ marginTop: -(size / 6) }}>
			<Wifi
				color={colors["--foreground"]}
				size={size}
				style={{
					position: "absolute",
					opacity: 0.5,
				}}
			/>
			<SignalIcon color={colors[config.color ?? "--foreground"]} size={size} />
		</View>
	);
};
