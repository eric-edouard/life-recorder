// InsetList.tsx
import React, { Children, cloneElement, type ReactElement } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { twMerge } from "tailwind-merge";
import { InsetListRow, type InsetListRowProps } from "./InsetListRow";

type InsetListProps = {
	backgroundColor?: "secondary" | "tertiary";
	className?: string;
	headerLoading?: boolean;
	headerText?: string;
	listHeader?: ReactElement;
	footer?: string;
	/** Shown when no rows are passed */
	emptyStateText?: string;
	/** Overrides emptyStateText when provided */
	emptyStateComponent?: ReactElement;
	children?:
		| ReactElement<InsetListRowProps>
		| ReactElement<InsetListRowProps>[];
};

const InsetList = ({
	backgroundColor = "secondary",
	headerText,
	footer,
	children,
	headerLoading,
	listHeader,
	className,
	emptyStateText,
	emptyStateComponent,
}: InsetListProps) => {
	const items = Children.toArray(children) as ReactElement<InsetListRowProps>[];
	const isEmpty = items.length === 0;

	return (
		<View
			className={twMerge(
				"w-full",

				className,
			)}
		>
			{headerText && (
				<View className="flex-row items-center pb-2">
					<Text className="px-4 text-sm font-regular text-secondary-label">
						{headerText.toUpperCase()}
					</Text>
					{headerLoading && <ActivityIndicator size="small" color="gray" />}
				</View>
			)}

			<View
				className={twMerge(
					"rounded-lg overflow-hidden",
					backgroundColor === "secondary" && "bg-secondary-system-background",
					backgroundColor === "tertiary" && "bg-tertiary-system-background",
				)}
			>
				{listHeader}
				{isEmpty ? (
					emptyStateText ? (
						<Text className="py-4 px-4 text-sm text-secondary-label text-center">
							{emptyStateText}
						</Text>
					) : (
						emptyStateComponent
					)
				) : (
					items.map((child, i) =>
						cloneElement(child, { hideBorder: i === items.length - 1 }),
					)
				)}
			</View>

			{footer && (
				<Text className="px-4 pt-2 text-sm text-secondary-label">{footer}</Text>
			)}
		</View>
	);
};

InsetList.Row = InsetListRow;

export { InsetList };
