// InsetListRow.tsx
import { PressableLayer } from "@/src/components/PressableLayer";
import type { ReactNode } from "react";
import React from "react";
import { Text, View, type ViewProps } from "react-native";
import { twMerge } from "tailwind-merge";

export type InsetListRowProps = {
	title: string;
	detail?: string | ReactNode;
	accessory?: ReactNode;
	onPress?: () => void;
	hideBorder?: boolean;
} & ViewProps;

export const InsetListRow = ({
	title,
	detail,
	accessory,
	onPress,
	hideBorder = false,
	...rest
}: InsetListRowProps) => {
	return (
		<PressableLayer
			rounded={false}
			onPress={onPress}
			className={twMerge(
				"flex justify-center border-b-[0.5px] border-b-opaque-separator h-row px-md ",
				hideBorder && "border-b-0",
			)}
			{...rest}
		>
			<View className="flex-row justify-between items-center w-full">
				<Text className="text-lg text-label">{title}</Text>

				{accessory ? (
					accessory
				) : (
					<Text className="text-lg text-secondary-label">{detail}</Text>
				)}
			</View>
		</PressableLayer>
	);
};
