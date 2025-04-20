// InsetList.tsx
import React, { type ReactElement, Children, cloneElement } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { InsetListRowProps } from "./InsetListRow";

type InsetListProps = {
	headerLoading?: boolean;
	headerText?: string;
	listHeader?: ReactElement;
	footer?: string;
	children: ReactElement<InsetListRowProps> | ReactElement<InsetListRowProps>[];
};

export const InsetList = ({
	headerText,
	footer,
	children,
	headerLoading,
	listHeader,
}: InsetListProps) => {
	const items = Children.toArray(children) as ReactElement<InsetListRowProps>[];

	return (
		<View>
			{headerText && (
				<View className="flex-row items-center pb-2 ">
					<Text className="px-4 text-sm font-regular text-secondary-label">
						{headerText.toUpperCase()}
					</Text>
					{headerLoading && <ActivityIndicator size="small" color="gray" />}
				</View>
			)}
			<View className="bg-secondary-system-grouped-background rounded-lg overflow-hidden">
				{listHeader}
				{items.map((child, i) =>
					cloneElement(child, { hideBorder: i === items.length - 1 }),
				)}
			</View>
			{footer && (
				<Text className="px-4 pt-2 text-sm text-secondary-label">{footer}</Text>
			)}
		</View>
	);
};
