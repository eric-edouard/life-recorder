import { Text as RNText, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";

export const Text = ({ children, ...props }: TextProps) => {
	return (
		<RNText {...props} className={twMerge("text-foreground", props.className)}>
			{children}
		</RNText>
	);
};
