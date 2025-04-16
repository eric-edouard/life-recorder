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
			return null;
	}
};

export const SignalStrengthDynamicIcon = ({ strength }: Props) => {
	const colors = useThemeColors();
	return (
		<View style={{ width: 22, height: 22 }}>
			<Wifi
				color={colors["--background-level-2"]}
				size={20}
				style={{
					position: "absolute",
				}}
			/>
			{getIcon(strength, colors["--foreground"], 20)}
		</View>
	);
};
