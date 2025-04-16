import { Card } from "@/src/components/Card";
import { useThemeColor } from "@/src/contexts/ThemeContext";
import React, { useRef } from "react";
import { Animated } from "react-native";
import { Text } from "./Text";

type BackendStatusCardProps = {
	onPress: () => void;
};

export const BackendStatusCard = ({ onPress }: BackendStatusCardProps) => {
	const green = useThemeColor("--green");
	const yellow = useThemeColor("--yellow");
	const red = useThemeColor("--red");
	const blinkAnim = useRef(new Animated.Value(1)).current;

	return (
		<Card onPress={onPress} containerClassName="">
			<Text className="text-base font-semibold text-foreground mb-1">
				Backend Status
			</Text>
		</Card>
	);
};
