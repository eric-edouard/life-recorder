import { PressableLayer } from "@app/src/components/PressableLayer";
import { Text } from "@app/src/components/ui/Text";
import type { SystemColor } from "@app/src/types/colors";
import { twMerge } from "tailwind-merge";

export const RowButton = ({
	backgroundColor = "secondarySystemGroupedBackground",
	title,
	onPress,
	colorStyle = "default",
}: {
	backgroundColor?: SystemColor;
	title: string;
	onPress: () => void;
	colorStyle?: "default" | "destructive";
}) => {
	return (
		<PressableLayer
			backgroundColor={backgroundColor}
			onPress={onPress}
			className="px-4 py-3 w-full flex justify-center h-row"
		>
			<Text
				className={twMerge(
					"text-lg",
					colorStyle === "destructive" ? "text-red" : "text-blue",
				)}
			>
				{title}
			</Text>
		</PressableLayer>
	);
};
