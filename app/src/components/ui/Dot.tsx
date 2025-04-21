import { View } from "react-native";
import { twMerge } from "tailwind-merge";

export type DotColor = "red" | "green" | "blue" | "yellow" | "gray";
export type Props = {
	color: DotColor;
};

export const Dot = ({ color }: Props) => {
	const colorMap = {
		red: "bg-red",
		green: "bg-green",
		blue: "bg-blue",
		yellow: "bg-yellow",
		gray: "bg-gray",
	};

	return <View className={twMerge(`w-3 h-3 rounded-full`, colorMap[color])} />;
};
