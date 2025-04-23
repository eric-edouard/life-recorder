import { rgbaToHex } from "@/src/utils/rgbaToHex";
import { type SFSymbol, SymbolView } from "expo-symbols";
import { useColor } from "react-native-uikit-colors";

type Props = {
	percentage: number;
};

export const DeviceBatteryIcon = ({ percentage }: Props) => {
	const green = useColor("green");
	const yellow = useColor("yellow");
	const red = useColor("red");

	const secondaryLabel = useColor("quaternarySystemFill");

	const getIcon = (): SFSymbol => {
		if (percentage >= 90) return "battery.100percent";
		if (percentage >= 75) return "battery.75percent";
		if (percentage >= 40) return "battery.50percent";
		if (percentage >= 10) return "battery.25percent";
		return "battery.0percent";
	};

	const getInnerColor = (): string => {
		if (percentage >= 50) return green;
		if (percentage >= 25) return yellow;
		return red;
	};

	return (
		<SymbolView
			type="palette"
			name={getIcon()}
			colors={[rgbaToHex(getInnerColor()), rgbaToHex(secondaryLabel)]}
			size={42}
		/>
	);
};
