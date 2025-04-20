import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type Props = {
	children: React.ReactNode;
	className?: string;
};

export const ScreenPadding = ({ children, className }: Props) => {
	return (
		<View className={twMerge(`px-5 w-full flex items-start`, className)}>
			{children}
		</View>
	);
};
