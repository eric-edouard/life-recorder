import { Text } from "@app/src/components/ui/Text";
import { trpcQuery } from "@app/src/services/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ActivityIndicator, FlatList, View } from "react-native";

type UtteranceItemProps = {
	transcript: string;
	speakerName: string | null | undefined;
	timestamp: Date;
	confidence: number;
	isCurrentUser: boolean;
};

const UtteranceItem = ({
	transcript,
	speakerName,
	timestamp,
	confidence,
	isCurrentUser,
}: UtteranceItemProps) => {
	return (
		<View
			className={`flex-row max-w-[85%] mb-4 ${isCurrentUser ? "self-end" : "self-start"}`}
		>
			<View
				className={`rounded-2xl px-4 py-3 ${
					isCurrentUser
						? "bg-blue-light rounded-tr-none"
						: "bg-secondary-system-background rounded-tl-none"
				}`}
			>
				<Text
					className={`font-medium ${
						isCurrentUser ? "text-label" : "text-label"
					}`}
				>
					{transcript}
				</Text>

				<View className="flex-row justify-between items-center mt-1">
					<Text
						className={`text-xs ${
							isCurrentUser ? "text-quaternary-label" : "text-secondary-label"
						}`}
					>
						{speakerName || "Unknown"}
					</Text>
					<Text
						className={`text-xs ml-2 ${
							isCurrentUser ? "text-quaternary-label" : "text-secondary-label"
						}`}
					>
						{format(timestamp, "MMM d, h:mm a")}
					</Text>
				</View>

				<View className="mt-1">
					<Text
						className={`text-xs ${
							isCurrentUser ? "text-quaternary-label" : "text-secondary-label"
						}`}
					>
						Confidence: {Math.round(confidence * 100)}%
					</Text>
				</View>
			</View>
		</View>
	);
};

const EmptyState = () => (
	<View className="flex-1 items-center justify-center">
		<Text className="text-secondary-label text-lg">No conversations yet</Text>
		<Text className="text-tertiary-label text-sm mt-2 text-center">
			Your conversation history will appear here
		</Text>
	</View>
);

export const HistoryScreen = () => {
	const { data, isLoading } = useInfiniteQuery(
		trpcQuery.utterances.infiniteQueryOptions(
			{
				limit: 20,
				cursor: 0,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextPage,
			},
		),
	);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" />
				<Text className="text-secondary-label mt-4">
					Loading conversations...
				</Text>
			</View>
		);
	}

	if (!data) {
		return <EmptyState />;
	}

	return (
		<View className="mt-safe-offset-5 p-5 flex-1 w-full bg-system-background">
			<Text className="text-2xl font-bold mb-6 text-label">
				Conversation History
			</Text>

			{!data || data.pages.length === 0 ? (
				<EmptyState />
			) : (
				<FlatList
					data={data.pages.flatMap((page) => page.items).toReversed()}
					keyExtractor={(item) => item.utterance.id}
					renderItem={({ item }) => (
						<UtteranceItem
							transcript={item.utterance.transcript}
							speakerName={item.speaker?.name}
							timestamp={new Date(item.utterance.createdAt)}
							confidence={item.utterance.confidence}
							isCurrentUser={item.speaker?.isUser === true}
						/>
					)}
					contentContainerStyle={{ paddingBottom: 20 }}
				/>
			)}
		</View>
	);
};
