import { Text } from "@/src/components/Text";
import { useListScroll } from "@/src/contexts/ListScrollContext";
import { BlurView } from "expo-blur";
import { Animated } from "react-native";

const ScreenHeader = () => {
	const { scrollAnimatedValue } = useListScroll();

	return (
		<Animated.View
			className={"absolute top-0 left-0 right-0"}
			style={{
				opacity: scrollAnimatedValue.interpolate({
					inputRange: [0, 43, 53, 10000],
					outputRange: [0, 0, 1, 1],
					extrapolate: "clamp",
				}),
			}}
		>
			<BlurView intensity={100} className="flex justify-center items-center">
				<Text className="px-2  pt-safe-offset-1 pb-4 text-xl font-semibold">
					Life Logger
				</Text>
			</BlurView>
		</Animated.View>
	);
};

export { ScreenHeader };
