import { Text } from "@/src/components/Text";
import React, { useState } from "react";
import {
	Alert,
	Linking,
	Platform,
	SafeAreaView,
	TouchableOpacity,
	View,
} from "react-native";

import { ConnectionPill } from "@/src/components/ConnectionPill";
import { LiveTranscripts } from "@/src/components/LiveTranscripts";
import { ServerConnectionPill } from "@/src/components/ServerConnectionPill";
// Import components
import StatusBanner from "@/src/components/StatusBanner";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { audioDataService } from "@/src/services/audioDataService";
import { socketService } from "@/src/services/socketService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";

const HeaderContent = () => {
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
	const [showServerLogs, setShowServerLogs] = useState<boolean>(false);

	const startAudioListener = async () => {
		try {
			if (!connectedDeviceId || !omiDeviceManager.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}
			console.log("Starting audio bytes listener...");
			// Start audio collection using our service
			const success = await audioDataService.startAudioCollection();
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
		<View>
			<Text className="text-4xl font-extrabold mt-8">Life Logger</Text>
			{/* Connection Pills */}
			<View className="flex-row items-center mb-2.5 gap-2">
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
			<View className="mb-6 p-4 bg-white rounded-lg shadow-sm">
				{/* <TouchableOpacity
					className={`bg-[#007AFF] py-3 px-5 rounded-lg items-center shadow-sm`}
					onPress={toggleServerLogs}
				>
					<Text className="text-white text-base font-semibold">
						{showServerLogs ? "Close Server Logs" : "Open Server Logs"}
					</Text>
				</TouchableOpacity>

				{showServerLogs && <ServerLogs />} */}

				{connectedDeviceId && (
					<View className="mt-2.5">
						<TouchableOpacity
							className={
								isListeningAudio
									? "bg-[#FF9500] py-3 px-5 rounded-lg items-center shadow-sm"
									: "bg-[#007AFF] py-3 px-5 rounded-lg items-center shadow-sm"
							}
							onPress={
								isListeningAudio ? stopAudioListener : startAudioListener
							}
						>
							<Text className="text-white text-base font-semibold">
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
							<View className="mt-2.5 p-2 bg-[#f8f8f8] rounded-md items-center">
								<Text className="text-sm text-[#555] font-medium">
									Audio chunks saved: {savedAudioCount}
								</Text>
							</View>
						)} */}
					</View>
				)}
			</View>
		</View>
	);
};

export default function Home() {
	return (
		<SafeAreaView
			className={`flex-1 bg-background`}
			// style={{ backgroundColor: PlatformColor("systemRed") }}
		>
			<View
				className={`p-5 ${Platform.OS === "android" ? "pt-10" : ""} flex-1`}
			>
				<LiveTranscripts headerComponent={<HeaderContent />} />
			</View>
		</SafeAreaView>
	);
}
