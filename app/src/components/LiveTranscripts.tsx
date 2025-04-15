import { liveTranscriptionService } from "@/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import React from "react";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SpeechDetected } from "./SpeechDetected";

type Transcript = {
	transcript: string;
	startTime: number;
};

export const LiveTranscripts = () => {
	const transcripts = use$(liveTranscriptionService.transcripts$);
	const isTranscriptionInProgress = use$(
		liveTranscriptionService.isTranscriptionInProgress$,
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
		<View style={styles.transcriptItem}>
			<Text style={styles.timestamp}>{formatTime(item.startTime)}</Text>
			<Text style={styles.transcript}>{item.transcript}</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			<SpeechDetected />
			<Text style={styles.title}>Live Transcripts</Text>
			{transcripts.length === 0 ? (
				<Text style={styles.emptyMessage}>No transcripts yet</Text>
			) : (
				<>
					{isTranscriptionInProgress ? (
						<View style={styles.loaderContainer}>
							<ActivityIndicator size="small" color="#666" />
							<Text style={styles.loaderText}>Transcribing...</Text>
						</View>
					) : null}
					<FlatList
						data={transcripts}
						renderItem={renderItem}
						keyExtractor={(item) => item.startTime.toString()}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={true}
					/>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		// borderWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 12,
	},
	listContent: {
		paddingBottom: 20,
		height: "100%",
	},
	transcriptItem: {
		marginBottom: 10,
		padding: 12,
		backgroundColor: "white",
		borderRadius: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 1,
	},
	timestamp: {
		fontSize: 12,
		color: "#666",
		marginBottom: 4,
		fontWeight: "500",
	},
	transcript: {
		fontSize: 15,
		color: "#333",
	},
	emptyMessage: {
		textAlign: "center",
		color: "#666",
		marginTop: 20,
		fontStyle: "italic",
	},
	loaderContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
		padding: 8,
		borderRadius: 8,
		marginBottom: 8,
	},
	loaderText: {
		marginLeft: 8,
		color: "#666",
		fontSize: 14,
	},
});
