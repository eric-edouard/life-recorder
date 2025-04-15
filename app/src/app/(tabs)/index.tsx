import React, { useState } from "react";
import {
	Alert,
	Linking,
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { ConnectionPill } from "@/src/components/ConnectionPill";
import { LiveTranscripts } from "@/src/components/LiveTranscripts";
import { ServerConnectionPill } from "@/src/components/ServerConnectionPill";
import { ServerLogs } from "@/src/components/ServerLogs";
// Import components
import StatusBanner from "@/src/components/StatusBanner";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { audioDataService } from "@/src/services/audioDataService";
import { socketService } from "@/src/services/socketService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";

export default function Home() {
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
	const [showServerLogs, setShowServerLogs] = useState<boolean>(false);
	const [audioPacketsReceived, setAudioPacketsReceived] = useState<number>(0);
	// Audio saving statistics
	const [savedAudioCount, setSavedAudioCount] = useState<number>(0);

	const startAudioListener = async () => {
		try {
			if (!connectedDeviceId || !omiDeviceManager.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			// Reset state
			setAudioPacketsReceived(0);
			setSavedAudioCount(0);

			console.log("Starting audio bytes listener...");

			// Start audio collection using our service
			const success = await audioDataService.startAudioCollection(
				(packetsReceived, savedCount) => {
					// Update statistics in the UI
					setAudioPacketsReceived(packetsReceived);
					setSavedAudioCount(savedCount);
				},
			);

			if (success) {
				setIsListeningAudio(true);
			} else {
				Alert.alert("Error", "Failed to start audio listener");
			}
		} catch (error) {
			console.error("Start audio listener error:", error);
			Alert.alert("Error", `Failed to start audio listener: ${error}`);
		}
	};

	const stopAudioListener = async () => {
		try {
			// Stop audio collection using our service
			await audioDataService.stopAudioCollection();
			setIsListeningAudio(false);
		} catch (error) {
			console.error("Stop audio listener error:", error);
			Alert.alert("Error", `Failed to stop audio listener: ${error}`);
		}
	};

	const handleServerReconnect = async () => {
		try {
			const initiated = await socketService.reconnectToServer();
			if (initiated) {
				console.log("Server reconnection initiated");
			}
		} catch (error) {
			console.error("Server reconnect error:", error);
		}
	};

	const toggleServerLogs = () => {
		setShowServerLogs(!showServerLogs);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text className="text-4xl font-extrabold mt-8">Life Logger</Text>
				{/* Connection Pills */}
				<View style={styles.pillContainer}>
					<ConnectionPill onPress={() => router.push("/pair-device")} />
					<ServerConnectionPill onPress={handleServerReconnect} />
				</View>

				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={omiDeviceManager.requestBluetoothPermission}
					onOpenSettings={() => Linking.openSettings()}
				/>

				{/* Server Logs Section */}
				<View style={styles.section}>
					<TouchableOpacity style={styles.button} onPress={toggleServerLogs}>
						<Text style={styles.buttonText}>
							{showServerLogs ? "Close Server Logs" : "Open Server Logs"}
						</Text>
					</TouchableOpacity>

					{showServerLogs && <ServerLogs />}

					{connectedDeviceId && (
						<View style={styles.audioControls}>
							<TouchableOpacity
								style={[
									styles.button,
									isListeningAudio ? styles.buttonWarning : null,
								]}
								onPress={
									isListeningAudio ? stopAudioListener : startAudioListener
								}
							>
								<Text style={styles.buttonText}>
									{isListeningAudio
										? "Stop Audio Listener"
										: "Start Audio Listener"}
								</Text>
							</TouchableOpacity>

							{/* <AudioStats
								audioPacketsReceived={audioPacketsReceived}
								showIf={isListeningAudio}
							/>
							{isListeningAudio && (
								<View style={styles.statsContainer}>
									<Text style={styles.statsText}>
										Audio chunks saved: {savedAudioCount}
									</Text>
								</View>
							)} */}
						</View>
					)}
				</View>
				<LiveTranscripts />
			</View>
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
		gap: 8,
		flexDirection: "row",
	},
	statsContainer: {
		marginTop: 10,
		padding: 8,
		backgroundColor: "#f8f8f8",
		borderRadius: 6,
		alignItems: "center",
	},
	statsText: {
		fontSize: 14,
		color: "#555",
		fontWeight: "500",
	},
});
