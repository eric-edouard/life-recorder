import { AudioPlayer } from "@app/src/components/AudioPlayer";
import { trpcQuery } from "@app/src/services/trpc";
import { extractDataFromFileName } from "@app/src/utils/extractDataFromFileName";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function UtteranceModal() {
	const { utteranceId } = useLocalSearchParams<{ utteranceId: string }>();
	const { data: utterance } = useQuery(
		trpcQuery.utterance.queryOptions(utteranceId),
	);

	const { data: fileUrl, isLoading } = useQuery(
		trpcQuery.fileUrl.queryOptions(utterance?.fileId!, {
			enabled: !!utterance?.fileId,
		}),
	);

	const { date, durationSeconds } = utterance?.fileId
		? extractDataFromFileName(utterance?.fileId)
		: { date: new Date(), durationSeconds: undefined };

	return (
		<ScrollView className="flex-1">
			{/* <Text>{JSON.stringify(utterance, null, 2)}</Text> */}
			<AudioPlayer
				fileUrl={fileUrl ?? ""}
				title={utterance?.transcript ?? ""}
				date={date}
				duration={durationSeconds ?? 0}
				closeModal={() => {
					router.back();
				}}
			/>
		</ScrollView>
	);
}
