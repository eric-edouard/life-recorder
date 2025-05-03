import { LiveUtteranceItem } from "@app/src/components/LiveUtteranceItem";
import { Text } from "@app/src/components/ui/Text";
import {
	type LiveUtterance,
	liveTranscriptionService,
} from "@app/src/services/liveTranscriptionService";
import { speakersService } from "@app/src/services/speakersService";
import { trpcQuery } from "@app/src/services/trpc";
import { use$ } from "@legendapp/state/react";
import { useQuery } from "@tanstack/react-query";
import { FlatList, View } from "react-native";

export default function LiveScreen() {
	const { data: historicalData } = useQuery(
		trpcQuery.utterances.queryOptions({
			limit: 10,
			cursor: 0,
		}),
	);

	const historicalUtterances: LiveUtterance[] = historicalData
		? historicalData.items.map((item) => ({
				utteranceId: item.utterance.id,
				speechStart: item.utterance.createdAt.getTime(),
				speechEnd: item.utterance.createdAt.getTime(),
				transcript: item.utterance.transcript,
				speakerStatus: "recognized",
				speakerId: item.speaker?.id || null,
				voiceProfileId: item.utterance.voiceProfileId || null,
			}))
		: [];

	const liveUtterancesFromService = use$(
		liveTranscriptionService.liveUtterances$,
	);

	const combinedUtterances = [
		...liveUtterancesFromService,
		...historicalUtterances,
	].filter(
		(value, index, self) =>
			index === self.findIndex((t) => t.utteranceId === value.utteranceId),
	);

	const speakers = use$(speakersService.speakers$);
	const isSpeechDetected = use$(liveTranscriptionService.isSpeechDetected$);
	const speechProcessingStatus = use$(
		liveTranscriptionService.speechProcessingStatus$,
	);

	return (
		<View className="flex-1 w-full bg-system-background">
			<FlatList
				inverted
				data={combinedUtterances}
				keyExtractor={(item) => item.utteranceId}
				renderItem={({ item }) => (
					<LiveUtteranceItem item={item} speakers={speakers ?? []} />
				)}
				ListHeaderComponent={
					speechProcessingStatus !== "none" &&
					speechProcessingStatus !== "done" ? (
						<View className="p-4 bg-secondary-system-background">
							<Text className="text-center text-secondary-label">
								{`Current processing status: ${speechProcessingStatus}`}
							</Text>
						</View>
					) : null
				}
				contentContainerClassName="flex-col"
			/>

			<View className="pb-safe-offset-4 p-4 ">
				<Text
					className={`text-center ${isSpeechDetected ? "text-red font-bold" : "text-gray-500"} `}
				>
					{isSpeechDetected ? "Speech detected" : "Idle"}
				</Text>
			</View>
		</View>
	);
}
