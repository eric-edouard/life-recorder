import React from "react";
import { TouchableOpacity, View } from "react-native";
import { State } from "react-native-ble-plx";
import { Text } from "./Text";

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
		<View className="bg-[#FF9500] p-3 rounded-lg mb-4 flex-row justify-between items-center">
			<Text className="text-white text-sm font-medium flex-1 mr-2.5">
				{getBannerMessage()}
			</Text>
			<TouchableOpacity
				className="bg-white/30 py-1.5 px-3 rounded-md"
				onPress={handleAction}
			>
				<Text className="text-white font-semibold text-xs">
					{getButtonText()}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

export default StatusBanner;
