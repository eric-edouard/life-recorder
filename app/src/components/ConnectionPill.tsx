import { deviceService } from "@app/src/services/deviceService/deviceService";
import { scanDevicesService } from "@app/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import { State } from "react-native-ble-plx";
import { Text } from "./ui/Text";

type ConnectionPillProps = {
	onPress: () => void;
};

export const ConnectionPill: React.FC<ConnectionPillProps> = ({ onPress }) => {
	const blinkAnim = useRef(new Animated.Value(1)).current;
	const batteryLevel = use$(deviceService.batteryLevel$);

	// Get state directly from deviceService
	const bluetoothState = use$(scanDevicesService.bluetoothState$);
	const connectedDeviceId = use$(deviceService.connectedDeviceId$);
	const scanning = use$(scanDevicesService.scanning$);
	const isConnecting = use$(deviceService.isConnecting$);

	// Start blinking animation when scanning or connecting
	useEffect(() => {
		let animationLoop: Animated.CompositeAnimation;

		if (scanning || isConnecting) {
			animationLoop = Animated.loop(
				Animated.sequence([
					Animated.timing(blinkAnim, {
						toValue: 0.3,
						duration: 500,
						useNativeDriver: false,
					}),
					Animated.timing(blinkAnim, {
						toValue: 1,
						duration: 500,
						useNativeDriver: false,
					}),
				]),
			);

			animationLoop.start();
		} else {
			// Reset to fully opaque when not animating
			Animated.timing(blinkAnim, {
				toValue: 1,
				duration: 0,
				useNativeDriver: false,
			}).start();
		}

		return () => {
			if (animationLoop) {
				animationLoop.stop();
			}
		};
	}, [scanning, isConnecting, blinkAnim]);

	const getStatusInfo = () => {
		// Bluetooth is off
		if (bluetoothState !== State.PoweredOn) {
			return {
				dotColor: "#888888", // Grey
				text: "Bluetooth Off",
				animateOpacity: false,
			};
		}

		// Connected to a device
		if (connectedDeviceId) {
			return {
				dotColor: "#34C759", // Green
				text:
					batteryLevel !== null ? `Connected (${batteryLevel}%)` : "Connected",
				animateOpacity: false,
			};
		}

		// Connecting to a device
		if (isConnecting) {
			return {
				dotColor: "#007AFF", // Blue
				text: "Connecting",
				animateOpacity: true,
			};
		}

		// Scanning for devices
		if (scanning) {
			return {
				dotColor: "#FFCC00", // Yellow
				text: "Scanning ...",
				animateOpacity: true,
			};
		}

		// Not connected
		return {
			dotColor: "#FF3B30", // Red
			text: "Not connected",
			animateOpacity: false,
		};
	};

	const { dotColor, text, animateOpacity } = getStatusInfo();

	return (
		<TouchableOpacity
			className="flex-row items-center bg-black/5 py-1.5 px-3 rounded-2xl self-start"
			onPress={onPress}
		>
			<Animated.View
				style={[
					{
						backgroundColor: dotColor,
						width: 10,
						height: 10,
						borderRadius: 5,
						marginRight: 6,
					},
					animateOpacity && { opacity: blinkAnim },
				]}
			/>
			<Text className="text-sm font-medium text-[#333]">{text}</Text>
		</TouchableOpacity>
	);
};
