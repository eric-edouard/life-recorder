import { useRef } from "react";
import {
	Animated,
	Pressable,
	type StyleProp,
	type ViewStyle,
	useColorScheme,
} from "react-native";
import { useColor } from "react-native-uikit-colors";
import { twMerge } from "tailwind-merge";

export const PressableLayer = ({
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
	const colorScheme = useColorScheme();
	const backgroundColor = useColor("secondarySystemGroupedBackground");
	const pressedBackgroundColor = useColor("gray4");

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
				className={twMerge("rounded-xl", className)}
				style={[
					{
						borderCurve: "continuous",
						backgroundColor: colorAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [backgroundColor, pressedBackgroundColor],
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
