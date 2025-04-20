import { liveTranscriptionService } from "@/src/services/liveTranscriptionService";
import { use$ } from "@legendapp/state/react";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Text } from "./ui/Text";

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
		<View className="mb-3 h-[30px]">
			{isSpeechDetected ? (
				<Animated.View
					style={[{ opacity: opacityAnim }]}
					className="py-1.5 px-3 rounded-full self-start bg-[#FF4D4D]"
				>
					<Text className="text-sm font-medium text-black">
						Speech detected
					</Text>
				</Animated.View>
			) : (
				<View className="py-1.5 px-3 rounded-full self-start bg-[#E0E0E0]">
					<Text className="text-sm font-medium text-black">
						No speech detected
					</Text>
				</View>
			)}
		</View>
	);
};
