import { Text } from "@app/src/components/ui/Text";
import { trpcQuery } from "@app/src/services/trpc";
import { useQuery } from "@tanstack/react-query";
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
						? "bg-blue-400 dark:bg-blue-600 rounded-tr-none"
						: "bg-gray-200 dark:bg-gray-700 rounded-tl-none"
				}`}
			>
				<Text
					className={`font-medium ${isCurrentUser ? "text-white" : "text-black dark:text-white"}`}
				>
					{transcript}
				</Text>

				<View className="flex-row justify-between items-center mt-1">
					<Text
						className={`text-xs ${isCurrentUser ? "text-gray-100 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
					>
						{speakerName || "Unknown"}
					</Text>
					<Text
						className={`text-xs ml-2 ${isCurrentUser ? "text-gray-100 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
					>
						{format(timestamp, "MMM d, h:mm a")}
					</Text>
				</View>

				<View className="mt-1">
					<Text
						className={`text-xs ${isCurrentUser ? "text-gray-100 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
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
		<Text className="text-gray-500 dark:text-gray-400 text-lg">
			No conversations yet
		</Text>
		<Text className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center">
			Your conversation history will appear here
		</Text>
	</View>
);

export const HistoryScreen = () => {
	const { data, isLoading } = useQuery(trpcQuery.utterances.queryOptions());

	console.log("🪲 DATA", data);
	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" />
				<Text className="text-gray-500 dark:text-gray-400 mt-4">
					Loading conversations...
				</Text>
			</View>
		);
	}

	return (
		<View className="mt-safe-offset-5 p-5 flex-1 w-full bg-white dark:bg-black">
			<Text className="text-2xl font-bold mb-6 text-black dark:text-white">
				Conversation History
			</Text>

			{!data || data.length === 0 ? (
				<EmptyState />
			) : (
				<FlatList
					data={data}
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
