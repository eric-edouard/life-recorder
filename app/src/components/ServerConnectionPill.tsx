import {
	SocketConnectionState,
	audioDataService,
} from "@/src/services/AudioDataService";
import { use$ } from "@legendapp/state/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

type ServerConnectionPillProps = {
	onPress?: () => void;
};

export const ServerConnectionPill: React.FC<ServerConnectionPillProps> = ({
	onPress,
}) => {
	const blinkAnim = useRef(new Animated.Value(1)).current;

	// Get connection state from audioDataService
	const connectionState = use$(audioDataService.connectionState$);
	const transport = audioDataService.getCurrentTransport();

	// Start blinking animation when connecting
	useEffect(() => {
		let animationLoop: Animated.CompositeAnimation;

		if (connectionState === SocketConnectionState.CONNECTING) {
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
	}, [connectionState, blinkAnim]);

	const getStatusInfo = () => {
		switch (connectionState) {
			case SocketConnectionState.CONNECTED:
				return {
					dotColor: "#34C759", // Green
					text: transport ? `Server: ${transport}` : "Server: Connected",
					animateOpacity: false,
				};
			case SocketConnectionState.CONNECTING:
				return {
					dotColor: "#007AFF", // Blue
					text: "Server: Connecting",
					animateOpacity: true,
				};
			default: // DISCONNECTED or any other state
				return {
					dotColor: "#FF3B30", // Red
					text: "Server: Disconnected",
					animateOpacity: false,
				};
		}
	};

	const { dotColor, text, animateOpacity } = getStatusInfo();

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
			disabled={!onPress}
		>
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
