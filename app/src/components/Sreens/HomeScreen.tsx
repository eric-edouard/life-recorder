import React, { useState } from "react";
import { Alert, View } from "react-native";

import { DeviceStatusButton } from "@/src/components/DeviceStatusButton";
import { ScreenScrollView } from "@/src/components/ScreenScrollView/ScreenScrollView";
// import { useAutoScanDevices } from "@/src/hooks/useAutoScanDevices";
import { audioDataService } from "@/src/services/audioDataService";
import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { socketService } from "@/src/services/socketService";
import { use$ } from "@legendapp/state/react";

export const HomeScreen = () => {
	// useAutoScanDevices();
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
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
		<ScreenScrollView.Container title="Life Recorder" className="pt-5">
			<View className="px-lg w-full flex items-start gap-3">
				<DeviceStatusButton />
				<ScreenScrollView.Title title="Life Recorder" />
			</View>
		</ScreenScrollView.Container>
	);
};
