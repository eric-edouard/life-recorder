import React, { useEffect } from "react";
import {
	Linking,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
} from "react-native";

import DeviceList from "@/src/components/DeviceList";
// Import components
import StatusBanner from "@/src/components/StatusBanner";
import { deviceConnectionManager } from "@/src/services/DeviceConnectionManager";
import { use$ } from "@legendapp/state/react";

// Target device ID to auto-connect
const TARGET_DEVICE_ID = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export default function PairDevice() {
	const connectedDeviceId = use$(deviceConnectionManager.connectedToDevice$);
	const devices = use$(deviceConnectionManager.devices$);
	const scanning = use$(deviceConnectionManager.scanning$);
	const bluetoothState = use$(deviceConnectionManager.bluetoothState$);

	useEffect(() => {
		deviceConnectionManager.startScan();
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={
						deviceConnectionManager.requestBluetoothPermission
					}
					onOpenSettings={() => Linking.openSettings()}
				/>

				{/* Device List */}
				{devices.length > 0 && (
					<DeviceList
						devices={devices}
						connected={!!connectedDeviceId}
						connectedDeviceId={connectedDeviceId}
						onConnect={deviceConnectionManager.connectToDevice}
						onDisconnect={deviceConnectionManager.disconnectFromDevice}
					/>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		padding: 20,
		paddingTop: Platform.OS === "android" ? 40 : 0,
		paddingBottom: 200,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
		textAlign: "center",
	},
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
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 15,
		color: "#333",
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
	codecContainer: {
		marginTop: 15,
		padding: 12,
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		alignItems: "center",
	},
	codecTitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#555",
	},
	codecValue: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#007AFF",
		marginTop: 5,
	},
	audioControls: {
		marginTop: 10,
	},
	pillContainer: {
		alignItems: "center",
		marginBottom: 10,
	},
});
