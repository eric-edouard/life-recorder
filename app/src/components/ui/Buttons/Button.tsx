import { Text } from "@app/src/components/ui/Text";
import { useSystemColors } from "@app/src/hooks/useSystemColors";
import type { SystemColor } from "@app/src/types/colors";
import { type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";
import { twMerge } from "tailwind-merge";

export type ButtonProps = {
	icon?: React.ReactNode;
	title: string;
	onPress: () => void;
	color?: SystemColor;
	style?: StyleProp<ViewStyle>;
	disabled?: boolean;
	textColor?: SystemColor;
};

export const Button = ({
	icon = null,
	title,
	onPress,
	color = "blue",
	style,
	disabled = false,
	textColor,
}: ButtonProps) => {
	const colors = useSystemColors();
	const _backgroundColor = colors[color];
	const _disabledBackgroundColor = colors.gray4;
	const _textColor = colors[textColor ?? "label"];
	return (
		<TouchableOpacity
			onPress={onPress}
			className=" w-fit rounded-2xl min-w-28 px-6 flex-row items-center justify-center h-[44px]"
			style={[
				{
					borderCurve: "continuous",
					backgroundColor: disabled
						? _disabledBackgroundColor
						: _backgroundColor,
				},
				style,
			]}
			disabled={disabled}
		>
			{icon}
			<Text
				className={twMerge(
					" text-center text-lg",
					disabled && "text-secondary-label",
					icon && "ml-2",
				)}
				style={
					disabled ? undefined : { color: textColor ? _textColor : "white" }
				}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
};
