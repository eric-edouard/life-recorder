import React from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

interface TranscriptionPanelProps {
	enableTranscription: boolean;
	onToggleTranscription: (enabled: boolean) => void;
	deepgramApiKey: string;
	onApiKeyChange: (text: string) => void;
	isListeningAudio: boolean;
	isTranscribing: boolean;
	onStartTranscription: () => void;
	onStopTranscription: () => void;
	transcription: string;
}

const TranscriptionPanel = ({
	enableTranscription,
	onToggleTranscription,
	deepgramApiKey,
	onApiKeyChange,
	isListeningAudio,
	isTranscribing,
	onStartTranscription,
	onStopTranscription,
	transcription,
}: TranscriptionPanelProps) => {
	return (
		<View style={styles.transcriptionContainer}>
			<Text style={styles.sectionSubtitle}>Deepgram Transcription</Text>

			<View style={styles.checkboxContainer}>
				<TouchableOpacity
					style={[
						styles.checkbox,
						enableTranscription && styles.checkboxChecked,
					]}
					onPress={() => onToggleTranscription(!enableTranscription)}
				>
					{enableTranscription && <Text style={styles.checkmark}>✓</Text>}
				</TouchableOpacity>
				<Text style={styles.checkboxLabel}>Enable Transcription</Text>
			</View>

			{enableTranscription && (
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>API Key:</Text>
					<TextInput
						style={styles.apiKeyInput}
						value={deepgramApiKey}
						onChangeText={onApiKeyChange}
						placeholder="Enter Deepgram API Key"
						secureTextEntry={true}
					/>
				</View>
			)}

			{enableTranscription && (
				<>
					<TouchableOpacity
						style={[
							styles.button,
							isTranscribing ? styles.buttonWarning : null,
							{ marginTop: 15, marginBottom: 15 },
						]}
						onPress={
							isTranscribing ? onStopTranscription : onStartTranscription
						}
						disabled={!isListeningAudio}
					>
						<Text style={styles.buttonText}>
							{isTranscribing ? "Stop Transcription" : "Start Transcription"}
						</Text>
					</TouchableOpacity>

					{transcription && (
						<View style={styles.transcriptionTextContainer}>
							<Text style={styles.transcriptionTitle}>Transcription:</Text>
							<Text style={styles.transcriptionText}>{transcription}</Text>
						</View>
					)}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	transcriptionContainer: {
		marginTop: 20,
		padding: 15,
		backgroundColor: "#f8f8f8",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	sectionSubtitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 12,
		color: "#333",
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
	},
	checkbox: {
		width: 22,
		height: 22,
		borderWidth: 1,
		borderColor: "#007AFF",
		borderRadius: 4,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	checkboxChecked: {
		backgroundColor: "#007AFF",
	},
	checkmark: {
		color: "white",
		fontSize: 14,
		fontWeight: "bold",
	},
	checkboxLabel: {
		fontSize: 14,
		color: "#333",
	},
	inputContainer: {
		marginBottom: 12,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 6,
		color: "#555",
	},
	apiKeyInput: {
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 6,
		padding: 10,
		fontSize: 14,
	},
	button: {
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "center",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	buttonWarning: {
		backgroundColor: "#FF9500",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	transcriptionTextContainer: {
		marginTop: 12,
		padding: 10,
		backgroundColor: "white",
		borderRadius: 6,
		borderLeftWidth: 3,
		borderLeftColor: "#007AFF",
	},
	transcriptionTitle: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 6,
		color: "#555",
	},
	transcriptionText: {
		fontSize: 14,
		color: "#333",
		lineHeight: 20,
	},
});

export default TranscriptionPanel;
