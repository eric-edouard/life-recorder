import { Text } from "@app/src/components/ui/Text";
import { liveTranscriptionService } from "@app/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import { View } from "react-native";

export const LiveTranscriptsWidget = () => {
	const isSpeechDetected = use$(liveTranscriptionService.isSpeechDetected$);
	const transcripts$ = use$(liveTranscriptionService.transcripts$);

	return (
		<View
			style={{ borderCurve: "continuous" }}
			className="bg-secondary-system-background rounded-2xl p-4 min-h-64 w-full flex-1"
		>
			<Text>Live Transcripts</Text>
			{transcripts$.map((transcript) => (
				<View key={transcript.utteranceId}>
					{/*  add speaker name */}
					{transcript.speaker ? (
						<Text>
							{transcript.speaker.isLoading
								? "Loading..."
								: transcript.speaker.speakerName}
						</Text>
					) : (
						<Text>Unknown</Text>
					)}
					<View className="flex-row items-center gap-2">
						<Text>{transcript.transcript}</Text>
					</View>
				</View>
			))}
		</View>
	);
};
