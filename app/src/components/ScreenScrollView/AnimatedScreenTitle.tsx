import { useScreenScroll } from "@/src/components/ScreenScrollView/ScreenScrollContext";
import { Animated } from "react-native";

type AnimatedScreenTitleProps = {
	title: string;
};

export const AnimatedScreenTitle = ({ title }: AnimatedScreenTitleProps) => {
	const { scrollAnimatedValue } = useScreenScroll();

	return (
		<Animated.Text
			className="text-3xl font-extrabold mt-10 mb-4 text-label"
			style={{
				opacity: scrollAnimatedValue.interpolate({
					inputRange: [-100, 15, 25],
					outputRange: [1, 1, 0],
				}),
				transform: [
					{
						scale: scrollAnimatedValue.interpolate({
							inputRange: [-100, 0, 100],
							outputRange: [1.2, 1, 1],
						}),
					},
				],
				transformOrigin: "left center",
			}}
		>
			{title}
		</Animated.Text>
	);
};
