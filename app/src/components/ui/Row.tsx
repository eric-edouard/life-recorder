import type React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Text } from "../Text";

export const Row = ({
	title,
	detailText,
	detailComponent,
	hideUnderline = false,
}: {
	title: string;
	detailText?: string;
	detailComponent?: React.ReactNode;
	hideUnderline?: boolean;
}) => {
	return (
		<View
			className={twMerge(
				"flex justify-center border-b border-b-opaque-separator h-row",
				hideUnderline && "border-b-0",
			)}
		>
			<View className="flex-row justify-between items-center w-full">
				<Text className="text-lg text-label">{title}</Text>
				{detailComponent || (
					<Text className="text-lg text-secondary-label">{detailText}</Text>
				)}
			</View>
		</View>
	);
};
