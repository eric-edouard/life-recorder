import { useListScroll } from "@/src/contexts/ListScrollContext";
import { Animated } from "react-native";

export const AnimatedScreenTitle = () => {
	const { scrollAnimatedValue } = useListScroll();

	return (
		<Animated.Text
			className="text-3xl font-extrabold mt-10 mb-4 text-foreground"
			style={{
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
			Life Logger
		</Animated.Text>
	);
};
