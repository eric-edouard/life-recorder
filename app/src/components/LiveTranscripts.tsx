import { useListScroll } from "@app/src/contexts/ListScrollContext";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import React, { type ReactNode } from "react";
import { ActivityIndicator, Animated, FlatList, View } from "react-native";
import { SpeechDetected } from "./SpeechDetected";
import { Text } from "./ui/Text";
type Transcript = {
	transcript: string;
	startTime: number;
};

type LiveTranscriptsProps = {
	headerComponent?: ReactNode;
};

export const LiveTranscripts = ({ headerComponent }: LiveTranscriptsProps) => {
	const { scrollAnimatedValue } = useListScroll();
	const transcripts = use$(liveTranscriptionService.transcripts$);
	const processingAudioPhase = use$(
		liveTranscriptionService.processingAudioPhase$,
	);
	const formatTime = (timestamp: number): string => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	};

	const renderItem = ({ item }: { item: Transcript }) => (
		<View className="mb-2.5 p-3 bg-white rounded-lg shadow-sm">
			<Text className="text-xs text-[#666] mb-1 font-medium">
				{formatTime(item.startTime)}
			</Text>
			<Text className="text-[15px] text-[#333]">{item.transcript}</Text>
		</View>
	);

	const TranscriptHeader = () => (
		<View className="">
			{headerComponent}
			<SpeechDetected />
			<Text className="text-lg font-semibold mb-3">Live Transcripts</Text>
			{processingAudioPhase !== "3-done" ? (
				<View className="flex-row items-center bg-[#f5f5f5] p-2 rounded-lg mb-2">
					<ActivityIndicator size="small" color="#666" />
					<Text className="ml-2 text-[#666] text-sm">
						{processingAudioPhase === "1-converting-to-wav"
							? "Converting to WAV..."
							: "Transcribing..."}
					</Text>
				</View>
			) : null}
		</View>
	);

	return (
		<FlatList
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
				{ useNativeDriver: false },
			)}
			style={{ flex: 1 }}
			// stickyHeaderIndices={[0]}
			ListHeaderComponent={TranscriptHeader}
			data={transcripts.toReversed()}
			renderItem={renderItem}
			keyExtractor={(item) => item.startTime.toString()}
			showsVerticalScrollIndicator={true}
			ListEmptyComponent={
				<Text className="text-center text-[#666] mt-5 italic">
					No transcripts yet
				</Text>
			}
		/>
	);
};
