import { Card } from "@/src/components/Card";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$ } from "@legendapp/state/react";
import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { State } from "react-native-ble-plx";
import { Text } from "./Text";

type DeviceCardProps = {
	onPress: () => void;
};

export const DeviceCard = ({ onPress }: DeviceCardProps) => {
	const blinkAnim = useRef(new Animated.Value(1)).current;
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

	// Get state directly from omiDeviceManager
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const scanning = use$(omiDeviceManager.scanning$);
	const isConnecting = use$(omiDeviceManager.isConnecting$);
	const devices = use$(omiDeviceManager.devices$);

	// Get the currently connected device (if any)
	const connectedDevice = devices.find(
		(device) => device.id === connectedDeviceId,
	);

	// Fetch battery level
	const fetchBatteryLevel = async () => {
		if (connectedDeviceId) {
			try {
				const level = await omiDeviceManager.getBatteryLevel();
				if (level >= 0) {
					setBatteryLevel(level);
				}
			} catch (error) {
				console.error("Error fetching battery level:", error);
			}
		} else {
			setBatteryLevel(null);
		}
	};

	// Fetch battery level when connected and every 30 seconds
	useEffect(() => {
		if (connectedDeviceId) {
			// Fetch immediately when connected
			fetchBatteryLevel();

			// Set up interval to fetch every 30 seconds
			const intervalId = setInterval(fetchBatteryLevel, 30000);

			// Clean up interval when disconnected or component unmounts
			return () => {
				clearInterval(intervalId);
				setBatteryLevel(null);
			};
		}
	}, [connectedDeviceId]);

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
							},
							animateOpacity && { opacity: blinkAnim },
						]}
					/>
					<Text className="text-sm font-medium text-[#333]">{text}</Text>
				</View>

				{batteryLevel !== null && connectedDeviceId && (
					<Text className="text-sm font-medium text-[#333]">
						{batteryLevel}%
					</Text>
				)}
			</View>

			{connectedDevice ? (
				<>
					<Text className="text-base font-semibold text-[#333] mb-1">
						{connectedDevice.name}
					</Text>
					<Text className="text-xs text-[#666]">
						Signal: {connectedDevice.rssi} dBm
					</Text>
				</>
			) : (
				<Text className="text-base font-medium text-[#333]">
					{bluetoothState === State.PoweredOn
						? "No device connected"
						: "Enable Bluetooth to connect"}
				</Text>
			)}
		</Card>
	);
};
