import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BatteryIndicatorProps {
	batteryLevel: number;
	showIf?: boolean;
}

const BatteryIndicator = ({
	batteryLevel,
	showIf = true,
}: BatteryIndicatorProps) => {
	if (!showIf || batteryLevel < 0) return null;

	return (
		<View style={styles.batteryContainer}>
			<Text style={styles.batteryTitle}>Battery Level:</Text>
			<View style={styles.batteryLevelContainer}>
				<View style={[styles.batteryLevelBar, { width: `${batteryLevel}%` }]} />
				<Text style={styles.batteryLevelText}>{batteryLevel}%</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	batteryContainer: {
		marginTop: 15,
		padding: 12,
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		alignItems: "center",
		borderLeftWidth: 4,
		borderLeftColor: "#4CD964",
	},
	batteryTitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#555",
	},
	batteryLevelContainer: {
		width: "100%",
		height: 24,
		backgroundColor: "#e0e0e0",
		borderRadius: 12,
		marginTop: 8,
		overflow: "hidden",
		position: "relative",
	},
	batteryLevelBar: {
		height: "100%",
		backgroundColor: "#4CD964",
		borderRadius: 12,
		position: "absolute",
		left: 0,
		top: 0,
	},
	batteryLevelText: {
		position: "absolute",
		width: "100%",
		textAlign: "center",
		lineHeight: 24,
		fontSize: 12,
		fontWeight: "bold",
		color: "#333",
	},
});

export default BatteryIndicator;
