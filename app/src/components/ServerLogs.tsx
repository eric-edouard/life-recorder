import { serverLogsService } from "@/src/services/serverLogsService";
import type { ServerLog } from "@/src/shared/socketEvents";
import { use$ } from "@legendapp/state/react";
import React, { useEffect } from "react";
import { FlatList, Platform, View } from "react-native";
import { Text } from "./ui/Text";

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
		<View className="flex-row mb-1 py-0.5">
			<Text className="text-[#555555] text-[9px] mr-2">
				{formatTimestamp(log.timestamp)}
			</Text>
			<Text
				className={`flex-1 text-[11px] font-['${Platform.OS === "ios" ? "Menlo" : "monospace"}']`}
				style={{ color: getLogColor(log.type) }}
			>
				{log.message}
			</Text>
		</View>
	);

	const renderEmptyComponent = () => (
		<Text className="text-[#555555] italic text-center mt-5">
			No logs yet...
		</Text>
	);

	return (
		<View className="h-[280px] bg-[#1E1E1E] rounded-lg overflow-hidden my-2.5">
			<FlatList
				inverted
				className="flex-1"
				contentContainerStyle={{ padding: 8, flexGrow: 1 }}
				data={logs.toReversed()}
				renderItem={renderLogItem}
				keyExtractor={(log, index) => `${log.timestamp}-${index}`}
				ListEmptyComponent={renderEmptyComponent}
			/>
		</View>
	);
};
