import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$ } from "@legendapp/state/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { State } from "react-native-ble-plx";

type ConnectionPillProps = {
	onPress: () => void;
};

const ConnectionPill: React.FC<ConnectionPillProps> = ({ onPress }) => {
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
		<TouchableOpacity style={styles.container} onPress={onPress}>
			<Animated.View
				style={[
					styles.dot,
					{ backgroundColor: dotColor },
					animateOpacity && { opacity: blinkAnim },
				]}
			/>
			<Text style={styles.text}>{text}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 16,
		alignSelf: "flex-start",
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 6,
	},
	text: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
	},
});

export default ConnectionPill;
