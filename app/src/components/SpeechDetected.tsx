import { liveTranscriptionService } from "@/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export const SpeechDetected = () => {
	const isSpeechDetected = use$(liveTranscriptionService.isSpeechDetected$);
	const opacityAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (isSpeechDetected) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(opacityAnim, {
						toValue: 0.4,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(opacityAnim, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
				]),
			).start();
		} else {
			Animated.timing(opacityAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}).start();
		}
	}, [isSpeechDetected, opacityAnim]);

	return (
		<View style={styles.statusContainer}>
			{isSpeechDetected ? (
				<Animated.View
					style={[
						styles.pill,
						styles.speechDetectedPill,
						{ opacity: opacityAnim },
					]}
				>
					<Text style={styles.pillText}>Speech detected</Text>
				</Animated.View>
			) : (
				<View style={[styles.pill, styles.noSpeechPill]}>
					<Text style={styles.pillText}>No speech detected</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	statusContainer: {
		marginBottom: 12,
		height: 30,
	},
	pill: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		alignSelf: "flex-start",
	},
	noSpeechPill: {
		backgroundColor: "#E0E0E0",
	},
	speechDetectedPill: {
		backgroundColor: "#FF4D4D",
	},
	pillText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
});
