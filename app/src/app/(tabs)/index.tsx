import { Text } from "@/src/components/Text";
import React, { useState } from "react";
import { Alert, Linking, TouchableOpacity, View } from "react-native";

import { AnimatedScreenHeader } from "@/src/components/AnimatedScreenHeader";
import { AnimatedScreenTitle } from "@/src/components/AnimatedScreenTitle";
import { BackendStatusCard } from "@/src/components/BackendStatusCard";
import StatusBanner from "@/src/components/BlutoothPermissionsbanner";
import { DeviceCard } from "@/src/components/DeviceCard/DeviceCard";
import { LiveTranscripts } from "@/src/components/LiveTranscripts";
import { LocationPermissionsBanner } from "@/src/components/LocationPermissionsBanner";
import { ServerConnectionPill } from "@/src/components/ServerConnectionPill";
import { ListScrollProvider } from "@/src/contexts/ListScrollContext";
import { audioDataService } from "@/src/services/audioDataService";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { socketService } from "@/src/services/socketService";
import { use$ } from "@legendapp/state/react";
import { router } from "expo-router";

const HeaderContent = () => {
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const bluetoothState = use$(deviceService.bluetoothState$);
	const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
	const startAudioListener = async () => {
		try {
			if (!connectedDeviceId || !deviceService.isConnected()) {
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

	return (
		<View className={"p-5 pt-safe-offset-3"}>
			<AnimatedScreenTitle />
			<LocationPermissionsBanner />
			<View className="flex-row gap-3">
				<DeviceCard onPress={() => router.push("/pair-device")} />
				<BackendStatusCard onPress={() => router.push("/pair-device")} />
			</View>
			{/* Connection Pills */}
			<View className="flex-row items-center mb-2.5 gap-2">
				{/* <ConnectionPill onPress={() => router.push("/pair-device")} /> */}
				<ServerConnectionPill onPress={handleServerReconnect} />
			</View>

			{/* Bluetooth Status Banner */}
			<StatusBanner
				bluetoothState={bluetoothState}
				onRequestPermission={deviceService.requestBluetoothPermission}
				onOpenSettings={() => Linking.openSettings()}
			/>
			{connectedDeviceId && (
				<View className="mt-2.5">
					<TouchableOpacity
						className={
							isListeningAudio
								? "bg-[#FF9500] py-3 px-5 rounded-lg items-center shadow-sm"
								: "bg-[#007AFF] py-3 px-5 rounded-lg items-center shadow-sm"
						}
						onPress={isListeningAudio ? stopAudioListener : startAudioListener}
					>
						<Text className="text-white text-base font-semibold">
							{isListeningAudio
								? "Stop Audio Listener"
								: "Start Audio Listener"}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

export default function Home() {
	return (
		<ListScrollProvider>
			<View className={`flex-1 bg-background`}>
				<LiveTranscripts headerComponent={<HeaderContent />} />
				<AnimatedScreenHeader />
			</View>
		</ListScrollProvider>
	);
}
