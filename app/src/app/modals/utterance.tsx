import { AudioPlayerWithWords } from "@app/src/components/AudioPlayerWithWords";
import { Button } from "@app/src/components/ui/Buttons/Button";
import { trpcQuery } from "@app/src/services/trpc";
import type { Words } from "@app/src/types/words";
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

	const words = utterance?.words as Words;

	return (
		<ScrollView className="flex-1">
			{/* <Text>{JSON.stringify(utterance, null, 2)}</Text> */}
			<AudioPlayerWithWords
				fileUrl={fileUrl ?? ""}
				date={date}
				duration={durationSeconds ?? 0}
				closeModal={() => {
					router.back();
				}}
				words={words}
			/>
			<Button
				className="mx-5"
				onPress={() => {
					router.push(
						`/modals/assign-voice-profile-speaker?utteranceId=${utteranceId}`,
					);
				}}
				title="Assign Speaker"
			/>
		</ScrollView>
	);
}
