import { serverLogsService } from "@/src/services/ServerLogsService";
import type { ServerLog } from "@/src/types/socket-events";
import { use$ } from "@legendapp/state/react";
import React, { useEffect } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";

export const ServerLogs = () => {
	const logs = use$(serverLogsService.logs$);

	useEffect(() => {
		// Start listening when component mounts
		serverLogsService.startListeningToServerLogs();

		// Stop listening when component unmounts
		return () => {
			serverLogsService.stopListeningToServerLogs();
		};
	}, []);

	const getLogColor = (type: ServerLog["type"]) => {
		switch (type) {
			case "error":
				return "#FF3B30"; // Red for errors
			case "warn":
				return "#FF9500"; // Orange for warnings
			case "log":
				return "#8E8E93"; // Gray for normal logs
			default:
				return "#8E8E93";
		}
	};

	const formatTimestamp = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString();
	};

	const renderLogItem = ({ item: log }: { item: ServerLog }) => (
		<View style={styles.logEntry}>
			<Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
			<Text style={[styles.logText, { color: getLogColor(log.type) }]}>
				{log.message}
			</Text>
		</View>
	);

	const renderEmptyComponent = () => (
		<Text style={styles.emptyText}>No logs yet...</Text>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerText}>Server Logs</Text>
			</View>
			<FlatList
				style={styles.flatList}
				contentContainerStyle={styles.logContainer}
				data={logs}
				renderItem={renderLogItem}
				keyExtractor={(log, index) => `${log.timestamp}-${index}`}
				ListEmptyComponent={renderEmptyComponent}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		height: 300,
		backgroundColor: "#1E1E1E",
		borderRadius: 8,
		overflow: "hidden",
		marginVertical: 10,
	},
	header: {
		backgroundColor: "#333333",
		padding: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#444444",
	},
	headerText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 14,
	},
	flatList: {
		flex: 1,
	},
	logContainer: {
		padding: 8,
		flexGrow: 1,
	},
	logEntry: {
		flexDirection: "row",
		marginBottom: 4,
		paddingVertical: 2,
	},
	timestamp: {
		color: "#555555",
		fontSize: 12,
		marginRight: 8,
	},
	logText: {
		flex: 1,
		fontSize: 13,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
	},
	emptyText: {
		color: "#555555",
		fontStyle: "italic",
		textAlign: "center",
		marginTop: 20,
	},
});
