import { useScreenScroll } from "@app/components/ScreenScrollView/ScreenScrollContext";
import { Text } from "@app/components/ui/Text";
import { BlurView } from "expo-blur";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnimatedScreenHeaderProps = {
	title: string;
};

export const AnimatedScreenHeader = ({ title }: AnimatedScreenHeaderProps) => {
	const { scrollAnimatedValue } = useScreenScroll();

	const insets = useSafeAreaInsets();
	const headerHeight = insets.top + 44;
	return (
		<Animated.View
			className={"absolute top-0 left-0 right-0"}
			style={{
				opacity: scrollAnimatedValue.interpolate({
					inputRange: [0, 10, 20, 10000],
					outputRange: [0, 0, 1, 1],
					extrapolate: "clamp",
				}),
			}}
		>
			<BlurView
				intensity={100}
				className="flex items-center"
				style={{
					height: headerHeight,
				}}
			>
				<Text className=" pt-safe-offset-1 text-xl font-semibold">{title}</Text>
			</BlurView>
		</Animated.View>
	);
};
