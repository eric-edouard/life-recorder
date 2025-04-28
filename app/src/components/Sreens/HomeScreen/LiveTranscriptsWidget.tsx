import { Text } from "@app/src/components/ui/Text";
import { View } from "react-native";

export const LiveTranscriptsWidget = () => {
	return (
		<View
			style={{ borderCurve: "continuous" }}
			className=" bg-secondary-system-background rounded-2xl p-4 min-h-64 w-full flex-1"
		>
			<Text>Live Transcripts</Text>
		</View>
	);
};
