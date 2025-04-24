import { useScreenScroll } from "@app/components/ScreenScrollView/ScreenScrollContext";
import { Animated } from "react-native";

export const AnimatedScreenTitle = ({
	children,
}: { children: React.ReactNode }) => {
	const { scrollAnimatedValue } = useScreenScroll();

	return (
		<Animated.View
			style={{
				width: "100%",
				opacity: scrollAnimatedValue.interpolate({
					inputRange: [-100, 10, 15],
					outputRange: [1, 1, 0],
				}),
				transform: [
					{
						scale: scrollAnimatedValue.interpolate({
							inputRange: [-100, 0, 100],
							outputRange: [1.1, 1, 1],
						}),
					},
				],
				transformOrigin: "left center",
			}}
		>
			{children}
		</Animated.View>
	);
};
