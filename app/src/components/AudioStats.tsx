import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AudioStatsProps {
	audioPacketsReceived: number;
	showIf?: boolean;
}

const AudioStats = ({
	audioPacketsReceived,
	showIf = true,
}: AudioStatsProps) => {
	if (!showIf) return null;

	return (
		<View style={styles.audioStatsContainer}>
			<Text style={styles.audioStatsTitle}>Audio Packets Received:</Text>
			<Text style={styles.audioStatsValue}>{audioPacketsReceived}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	audioStatsContainer: {
		marginTop: 15,
		padding: 12,
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		alignItems: "center",
		borderLeftWidth: 4,
		borderLeftColor: "#FF9500",
	},
	audioStatsTitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#555",
	},
	audioStatsValue: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#FF9500",
		marginTop: 5,
	},
});

export default AudioStats;
