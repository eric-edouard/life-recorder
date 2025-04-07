import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { State } from "react-native-ble-plx";

interface StatusBannerProps {
	bluetoothState: State;
	onRequestPermission: () => void;
	onOpenSettings: () => void;
}

const StatusBanner = ({
	bluetoothState,
	onRequestPermission,
	onOpenSettings,
}: StatusBannerProps) => {
	if (bluetoothState === State.PoweredOn) return null;

	const getBannerMessage = (): string => {
		switch (bluetoothState) {
			case State.PoweredOff:
				return "Bluetooth is turned off. Please enable Bluetooth to use this app.";
			case State.Unauthorized:
				return "Bluetooth permission not granted. Please allow Bluetooth access in settings.";
			default:
				return "Bluetooth is not available or initializing...";
		}
	};

	const getButtonText = (): string => {
		return bluetoothState === State.PoweredOff
			? "Open Settings"
			: "Request Permission";
	};

	const handleAction = () => {
		if (bluetoothState === State.PoweredOff) {
			onOpenSettings();
		} else if (bluetoothState === State.Unauthorized) {
			onRequestPermission();
		}
	};

	return (
		<View style={styles.statusBanner}>
			<Text style={styles.statusText}>{getBannerMessage()}</Text>
			<TouchableOpacity style={styles.statusButton} onPress={handleAction}>
				<Text style={styles.statusButtonText}>{getButtonText()}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	statusBanner: {
		backgroundColor: "#FF9500",
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	statusText: {
		color: "white",
		fontSize: 14,
		fontWeight: "500",
		flex: 1,
		marginRight: 10,
	},
	statusButton: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 6,
	},
	statusButtonText: {
		color: "white",
		fontWeight: "600",
		fontSize: 12,
	},
});

export default StatusBanner;
