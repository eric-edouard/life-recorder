import { IconAndText } from "@/src/components/ui/IconAndText";
import { Bluetooth } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useColor } from "react-native-uikit-colors";

export function SearchingDevices() {
	const gray2 = useColor("gray2");
	const animatedValue = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(animatedValue, {
					toValue: 0.2,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(animatedValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			]),
		).start();
	}, []);

	return (
		<IconAndText
			className="mb-safe-offset-3 mt-3"
			icon={
				<Animated.View style={{ opacity: animatedValue }}>
					<Bluetooth size={56} color={gray2} />
				</Animated.View>
			}
			title="Searching..."
			message="Looking for compatible devices"
		/>
	);
}
