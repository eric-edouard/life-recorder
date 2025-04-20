import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type Props = {
	color: "red" | "green" | "blue" | "yellow";
};

export const Dot = ({ color }: Props) => {
	const colorMap = {
		red: "bg-red",
		green: "bg-green",
		blue: "bg-blue",
		yellow: "bg-yellow",
	};

	return <View className={twMerge(`w-3 h-3 rounded-full`, colorMap[color])} />;
};
