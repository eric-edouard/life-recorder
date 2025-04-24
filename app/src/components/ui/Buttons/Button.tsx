import { Text } from "@app/components/ui/Text";
import type { SystemColor } from "@app/types/colors";
import { type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";
import { useColor } from "react-native-uikit-colors";
import { twMerge } from "tailwind-merge";

export type ButtonProps = {
	title: string;
	onPress: () => void;
	color?: SystemColor;
	style?: StyleProp<ViewStyle>;
	disabled?: boolean;
	textColor?: SystemColor;
};

export const Button = ({
	title,
	onPress,
	color = "blue",
	style,
	disabled = false,
	textColor,
}: ButtonProps) => {
	const _backgroundColor = useColor(color);
	const _disabledBackgroundColor = useColor("gray4");
	const _textColor = useColor(textColor ?? "label");
	return (
		<TouchableOpacity
			onPress={onPress}
			className=" w-fit rounded-2xl min-w-28 px-6 items-center justify-center h-[44px]"
			style={[
				{
					backgroundColor: disabled
						? _disabledBackgroundColor
						: _backgroundColor,
				},
				style,
			]}
			disabled={disabled}
		>
			<Text
				className={twMerge(
					" text-center text-lg",
					disabled && "text-secondary-label",
				)}
				style={{ color: textColor ? _textColor : "white" }}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
};
