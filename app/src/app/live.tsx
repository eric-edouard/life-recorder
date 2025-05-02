import { LiveUtteranceItem } from "@app/src/components/LiveUtteranceItem";
import { Text } from "@app/src/components/ui/Text";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import { FlatList, View } from "react-native";

export default function LiveScreen() {
	const liveTranscripts = use$(liveTranscriptionService.liveUtterances$);
	const isSpeechDetected = use$(liveTranscriptionService.isSpeechDetected$);
	const speechProcessingStatus = use$(
		liveTranscriptionService.speechProcessingStatus$,
	);

	return (
		<View className="flex-1 w-full bg-system-background">
			<FlatList
				inverted
				data={liveTranscripts}
				keyExtractor={(item) => item.utteranceId}
				renderItem={({ item }) => <LiveUtteranceItem item={item} />}
				contentContainerStyle={{ paddingBottom: 20 }}
			/>

			{speechProcessingStatus !== "none" &&
				speechProcessingStatus !== "done" && (
					<View className="p-4 bg-secondary-system-background">
						<Text className="text-center text-secondary-label">
							{`Current processing status: ${speechProcessingStatus}`}
						</Text>
					</View>
				)}
			<View className="p-4">
				<Text
					className={`text-center ${isSpeechDetected ? "text-red-500" : "text-gray-500"}`}
				>
					{isSpeechDetected ? "Speech detected" : "Idle"}
				</Text>
			</View>
		</View>
	);
}
