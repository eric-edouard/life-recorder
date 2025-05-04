import { Text } from "@app/src/components/ui/Text";
import { trpcQuery } from "@app/src/services/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function UtteranceModal() {
	const { utteranceId } = useLocalSearchParams<{ utteranceId: string }>();
	const { data: utterance } = useQuery(
		trpcQuery.utterance.queryOptions(utteranceId),
	);

	return (
		<ScrollView className="flex-1">
			<Text>Utterance</Text>
			<Text>{JSON.stringify(utterance, null, 2)}</Text>
		</ScrollView>
	);
}
