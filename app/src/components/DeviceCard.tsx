import { Card } from "@/src/components/Card";
import { DeviceSignalStrength } from "@/src/components/DeviceSignalStrength";
import { useThemeColor } from "@/src/contexts/ThemeContext";
import { useDeviceBatteryLevel } from "@/src/hooks/useDeviceBatteryLevel";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { Computed, use$ } from "@legendapp/state/react";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { State } from "react-native-ble-plx";
import { Text } from "./Text";
type DeviceCardProps = {
	onPress: () => void;
};

export const DeviceCard = ({ onPress }: DeviceCardProps) => {
	const green = useThemeColor("--green");
	const yellow = useThemeColor("--yellow");
	const red = useThemeColor("--red");
	const blinkAnim = useRef(new Animated.Value(1)).current;

	// Get state directly from omiDeviceManager
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const scanning = use$(omiDeviceManager.scanning$);
	const isConnecting = use$(omiDeviceManager.isConnecting$);
	const devices = use$(omiDeviceManager.devices$);
	const batteryLevel$ = useDeviceBatteryLevel();

	// Get the currently connected device (if any)
	const connectedDevice = devices.find(
		(device) => device.id === connectedDeviceId,
	);

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
		<Card onPress={onPress} className="flex-1">
			<View className="flex-row items-center justify-between mb-2">
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
					<Text className="text-sm font-medium text-foreground-subtle">
						{text}
					</Text>
				</View>

				<Computed>
					{() =>
						batteryLevel$.get() !== null && connectedDeviceId ? (
							<Text className="text-sm font-medium text-foreground-subtle">
								{batteryLevel$.get()}%
							</Text>
						) : null
					}
				</Computed>
			</View>

			{connectedDevice ? (
				<>
					<Text className="text-base font-semibold text-foreground mb-1">
						{connectedDevice.name}
					</Text>
					<DeviceSignalStrength />
				</>
			) : (
				<Text className="text-base font-medium text-foreground-subtle">
					{bluetoothState === State.PoweredOn
						? "No device connected"
						: "Enable Bluetooth to connect"}
				</Text>
			)}
		</Card>
	);
};
