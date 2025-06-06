import { LiveUtteranceItem } from "@app/src/components/LiveUtteranceItem";
import { Text } from "@app/src/components/ui/Text";
import {
	type LiveUtterance,
	liveTranscriptionService,
} from "@app/src/services/liveTranscriptionService";
import { speakersService } from "@app/src/services/speakersService";
import { trpcQuery } from "@app/src/services/trpc";
import { use$ } from "@legendapp/state/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlatList, View } from "react-native";

export default function LiveScreen() {
	const {
		data: historicalData,
		isLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(
		trpcQuery.utterances.infiniteQueryOptions(
			{
				limit: 20,
				cursor: 0,
			},
			{
				getNextPageParam: (lastPage) => {
					return lastPage.nextPage;
				},
			},
		),
	);

	const historicalUtterances: LiveUtterance[] = historicalData
		? historicalData.pages.flatMap((page) =>
				page.items
					.filter(
						(item) =>
							item.utterance.voiceProfileId !== null &&
							item.utterance.voiceProfileId !== undefined,
					)
					.map((item): LiveUtterance => {
						const voiceProfileId = item.utterance.voiceProfileId as string;
						const speakerId = item.speaker?.id;

						const commonProps = {
							utteranceId: item.utterance.id,
							speechStart: item.utterance.createdAt.getTime(),
							speechEnd: item.utterance.createdAt.getTime(),
							transcript: item.utterance.transcript,
							voiceProfileId: voiceProfileId,
						};

						if (speakerId) {
							return {
								...commonProps,
								speakerStatus: "recognized",
								speakerId: speakerId,
							};
						}
						return {
							...commonProps,
							speakerStatus: "unknown",
							speakerId: null,
						};
					}),
			)
		: [];

	const liveUtterancesFromService = use$(
		liveTranscriptionService.liveUtterances$,
	);

	const combinedUtterances = [
		...liveUtterancesFromService.toReversed(),
		...historicalUtterances,
	];

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
				renderItem={({ item, index }) => (
					<LiveUtteranceItem item={item} speakers={speakers ?? []} />
				)}
				onEndReached={() => {
					console.log("onEndReached, hasNextPage", hasNextPage);
					if (hasNextPage) {
						fetchNextPage();
					}
				}}
				onStartReached={() => {
					console.log("onStartReached");
				}}
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
