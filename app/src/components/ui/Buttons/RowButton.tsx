import { PressableLayer } from "@app/src/components/PressableLayer";
import { Text } from "@app/src/components/ui/Text";
import type { SystemColor } from "@app/src/types/colors";
import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { useColor } from "react-native-uikit-colors";
import { twMerge } from "tailwind-merge";

export const RowButton = ({
	backgroundColor = "secondarySystemGroupedBackground",
	title,
	onPress,
	colorStyle = "default",
	withChevron,
}: {
	backgroundColor?: SystemColor;
	title: string;
	onPress: () => void;
	colorStyle?: "default" | "primary" | "destructive";
	withChevron?: boolean;
}) => {
	const chevronColor = useColor("secondaryLabel");

	return (
		<PressableLayer
			backgroundColor={backgroundColor}
			onPress={onPress}
			className="px-4 py-3 w-full flex-row items-center justify-center h-row"
		>
			<Text
				className={twMerge(
					"text-lg flex-1",
					colorStyle === "destructive"
						? "text-red"
						: colorStyle === "primary"
							? "text-blue"
							: "text-label",
				)}
			>
				{title}
			</Text>
			{withChevron && (
				<View className="flex-row items-center gap-1 opacity-50">
					<ChevronRight size={24} color={chevronColor} />
				</View>
			)}
		</PressableLayer>
	);
};
