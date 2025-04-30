// InsetListRow.tsx
import { PressableLayer } from "@app/src/components/PressableLayer";
import type { SystemColor } from "@app/src/types/colors";
import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import React from "react";
import { Text, View, type ViewProps } from "react-native";
import { useColor } from "react-native-uikit-colors";
import { twMerge } from "tailwind-merge";

export type InsetListRowProps = {
	backgroundColor?: SystemColor;
	title: string;
	detail?: string | ReactNode;
	detailChevron?: boolean;
	accessory?: ReactNode;
	onPress?: () => void;
	hideBorder?: boolean;
} & ViewProps;

export const InsetListRow = ({
	backgroundColor = "secondarySystemGroupedBackground",
	title,
	detail,
	accessory,
	detailChevron = true,
	onPress,
	hideBorder = false,
	...rest
}: InsetListRowProps) => {
	const chevronColor = useColor("secondaryLabel");

	return (
		<PressableLayer
			backgroundColor={backgroundColor}
			rounded={false}
			onPress={onPress}
			className={"flex justify-center h-row"}
			{...rest}
		>
			<View className="flex-row justify-between items-center w-full px-md">
				<Text className="text-lg text-label font-normal">{title}</Text>

				{accessory ? (
					accessory
				) : (
					<View className="flex-row items-center gap-1">
						<Text className="text-lg text-secondary-label">{detail}</Text>
						{detailChevron && <ChevronRight size={20} color={chevronColor} />}
					</View>
				)}
			</View>
			<View
				className={twMerge(
					"left-5 absolute bottom-0 h-[0.5px] bg-opaque-separator w-full",
					hideBorder && "hidden",
				)}
			/>
		</PressableLayer>
	);
};
