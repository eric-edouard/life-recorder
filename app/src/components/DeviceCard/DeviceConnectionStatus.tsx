import { useThemeColor } from "@/src/contexts/ThemeContext";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$ } from "@legendapp/state/react";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { State } from "react-native-ble-plx";
import { Text } from "../Text";

export const DeviceConnectionStatus = () => {
	const green = useThemeColor("--green");
	const yellow = useThemeColor("--yellow");
	const red = useThemeColor("--red");
	const blinkAnim = useRef(new Animated.Value(1)).current;

	// Get state directly from omiDeviceManager
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const scanning = use$(omiDeviceManager.scanning$);
	const isConnecting = use$(omiDeviceManager.isConnecting$);

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
				dotColor: green, // Green
				text: "Connected",
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
				dotColor: yellow, // Yellow
				text: "Scanning ...",
				animateOpacity: true,
			};
		}

		// Not connected
		return {
			dotColor: red, // Red
			text: "Not connected",
			animateOpacity: false,
		};
	};

	const { dotColor, text, animateOpacity } = getStatusInfo();

	return (
		<View className="flex-row items-center">
			<Animated.View
				style={[
					{
						backgroundColor: dotColor,
						width: 10,
						height: 10,
						borderRadius: 5,
						marginRight: 8,
						opacity: 0.8,
					},
					animateOpacity && { opacity: blinkAnim },
				]}
			/>
			<Text className="text-md font-normal text-foreground">{text}</Text>
		</View>
	);
};
