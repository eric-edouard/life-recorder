import { deviceService } from "@/src/services/deviceService/deviceService";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { State } from "react-native-ble-plx";
import { useColor } from "react-native-uikit-colors";
import { Text } from "../Text";

export const DeviceConnectionStatus = () => {
	const green = useColor("green");
	const yellow = useColor("yellow");
	const red = useColor("red");
	const blinkAnim = useRef(new Animated.Value(1)).current;

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
		<View className="flex-row items-center gap-2">
			<View className="flex-row justify-center items-center w-6 ">
				<Animated.View
					style={[
						{
							backgroundColor: dotColor,
							width: 10,
							height: 10,
							borderRadius: 5,
							opacity: 0.8,
						},
						animateOpacity && { opacity: blinkAnim },
					]}
				/>
			</View>
			<Text className="font-normal text-secondary-label">{text}</Text>
		</View>
	);
};
