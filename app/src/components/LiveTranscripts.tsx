import { liveTranscriptionService } from "@/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SpeechDetected } from "./SpeechDetected";

type Transcript = {
	transcript: string;
	startTime: number;
};

export const LiveTranscripts = () => {
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

	return (
		<View>
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
			<FlatList
				StickyHeaderComponent={() => <Text>StickyHeaderComponent</Text>}
				ListHeaderComponent={() => <Text>ListHeaderComponent</Text>}
				data={transcripts}
				renderItem={renderItem}
				keyExtractor={(item) => item.startTime.toString()}
				contentContainerStyle={{ paddingBottom: 20, height: "100%" }}
				showsVerticalScrollIndicator={true}
				ListEmptyComponent={
					<Text className="text-center text-[#666] mt-5 italic">
						No transcripts yet
					</Text>
				}
			/>
		</View>
	);
};
