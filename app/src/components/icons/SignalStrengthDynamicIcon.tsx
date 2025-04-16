import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { SignalStrength } from "@/src/utils/rssiToSignalStrength";
import { Wifi, WifiHigh, WifiLow, WifiZero } from "lucide-react-native";
import { View } from "react-native";

type Props = {
	strength: SignalStrength | null;
};

const getIcon = (
	strength: SignalStrength | null,
	color: string,
	noColor: string,
	size: number,
) => {
	switch (strength) {
		case "excellent":
			return <Wifi color={color} size={size} />;
		case "good":
			return <WifiHigh color={color} size={size} />;
		case "moderate":
			return <WifiLow color={color} size={size} />;
		case "poor":
			return <WifiZero color={color} size={size} />;
		default:
			return <Wifi color={noColor} size={size} />;
	}
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
	return (
		<View className="" style={{ marginTop: -(size / 3) }}>
			<Wifi
				color={colors["--background-level-2"]}
				size={size}
				style={{
					position: "absolute",
				}}
			/>
			{getIcon(
				strength,
				colors["--foreground"],
				colors["--background-level-2"],
				size,
			)}
		</View>
	);
};
