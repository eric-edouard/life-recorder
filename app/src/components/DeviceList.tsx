import type { OmiDevice } from "@/src/services/OmiDeviceManager/types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DeviceListProps {
	devices: OmiDevice[];
	connected: boolean;
	connectedDeviceId: string | null;
	onConnect: (deviceId: string) => void;
	onDisconnect: () => void;
}

const DeviceList = ({
	devices,
	connected,
	connectedDeviceId,
	onConnect,
	onDisconnect,
}: DeviceListProps) => {
	if (devices.length === 0) return null;

	return (
		<View style={styles.section}>
			<View>
				{devices.map((device) => (
					<View key={device.id} style={styles.deviceItem}>
						<View>
							<Text style={styles.deviceName}>{device.name}</Text>
							<Text style={styles.deviceInfo}>RSSI: {device.rssi} dBm</Text>
						</View>
						{connected && connectedDeviceId === device.id ? (
							<TouchableOpacity
								style={[styles.button, styles.smallButton, styles.buttonDanger]}
								onPress={onDisconnect}
							>
								<Text style={styles.buttonText}>Disconnect</Text>
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								style={[
									styles.button,
									styles.smallButton,
									connected ? styles.buttonDisabled : null,
								]}
								onPress={() => onConnect(device.id)}
								disabled={connected}
							>
								<Text style={styles.buttonText}>Connect</Text>
							</TouchableOpacity>
						)}
					</View>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		marginBottom: 25,
		padding: 15,
		backgroundColor: "white",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
		marginTop: 24,
	},
	deviceItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	deviceName: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},
	deviceInfo: {
		fontSize: 12,
		color: "#666",
		marginTop: 2,
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
	smallButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	buttonDanger: {
		backgroundColor: "#FF3B30",
	},
	buttonDisabled: {
		backgroundColor: "#A0A0A0",
		opacity: 0.7,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
});

export default DeviceList;
