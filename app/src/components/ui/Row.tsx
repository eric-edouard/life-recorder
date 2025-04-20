import { PressableLayer } from "@/src/components/PressableLayer";
import type React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Text } from "./Text";

export const Row = ({
	title,
	detailText,
	detailComponent,
	hideUnderline = false,
	onPress,
}: {
	title: string;
	detailText?: string;
	detailComponent?: React.ReactNode;
	hideUnderline?: boolean;
	onPress?: () => void;
}) => {
	return (
		<PressableLayer
			onPress={onPress}
			className={twMerge(
				"flex justify-center border-b border-b-opaque-separator h-row px-md ",
				hideUnderline && "border-b-0",
			)}
		>
			<View className="flex-row justify-between items-center w-full">
				<Text className="text-lg text-label">{title}</Text>
				{detailComponent || (
					<Text className="text-lg text-secondary-label">{detailText}</Text>
				)}
			</View>
		</PressableLayer>
	);
};
