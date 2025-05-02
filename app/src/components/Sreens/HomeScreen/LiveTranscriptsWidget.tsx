import { PressableLayer } from "@app/src/components/PressableLayer";
import { Text } from "@app/src/components/ui/Text";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";
import { View } from "react-native";

export const LiveTranscriptsWidget = () => {
	const isSpeechDetected = use$(liveTranscriptionService.isSpeechDetected$);
	const transcripts$ = use$(liveTranscriptionService.liveUtterances$);

	return (
		<View className="p-5">
			<PressableLayer
				onPress={() => {
					router.push("/live");
				}}
				className="bg-secondary-system-background flex-row rounded-2xl p-4 min-h-64 w-full flex-1 "
			>
				<Text className="w-full ">Live Transcripts</Text>
				{transcripts$.map((transcript) => (
					<View key={transcript.utteranceId}>
						{/*  add speaker name */}
						{transcript.speakerId ? (
							<Text>
								{transcript.speakerId ? "Loading..." : transcript.speakerId}
							</Text>
						) : (
							<Text>Unknown</Text>
						)}
						<View className="flex-row items-center gap-2">
							<Text>{transcript.transcript}</Text>
						</View>
					</View>
				))}
			</PressableLayer>
		</View>
	);
};
