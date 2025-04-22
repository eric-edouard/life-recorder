import { PressableLayer } from "@/src/components/PressableLayer";
import { Text } from "@/src/components/ui/Text";
import { twMerge } from "tailwind-merge";

export const RowButton = ({
	backgroundColor = "secondary",
	title,
	onPress,
	colorStyle = "default",
}: {
	backgroundColor?: "secondary" | "tertiary";
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
