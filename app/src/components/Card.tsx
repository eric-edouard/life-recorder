import { useThemeColor } from "@/src/contexts/ThemeContext";
import { useRef } from "react";
import {
	Animated,
	Pressable,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { twMerge } from "tailwind-merge";

export const Card = ({
	children,
	containerClassName,
	className,
	onPress,
	style,
}: {
	children: React.ReactNode;
	containerClassName?: string;
	className?: string;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
}) => {
	const backgroundLevel1 = useThemeColor("--background-level-1");
	const backgroundLevel2 = useThemeColor("--background-level-2");
	const colorAnim = useRef(new Animated.Value(0)).current;

	const handlePressIn = () => {
		Animated.timing(colorAnim, {
			toValue: 1,
			useNativeDriver: true,
			duration: 100,
		}).start();
	};

	const handlePressOut = () => {
		Animated.timing(colorAnim, {
			toValue: 0,
			useNativeDriver: true,
			duration: 100,
		}).start();
	};

	return (
		<Pressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			className={containerClassName}
		>
			<Animated.View
				className={twMerge(
					"bg-background-level-1 p-4 rounded-2xl flex-1",
					className,
				)}
				style={[
					{
						borderCurve: "continuous",
						backgroundColor: colorAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [backgroundLevel1, backgroundLevel2],
						}),
					},
					style,
				]}
			>
				{children}
			</Animated.View>
		</Pressable>
	);
};
