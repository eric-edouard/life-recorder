import { Text } from "@/src/components/Text";
import { useListScroll } from "@/src/contexts/ListScrollContext";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { Animated } from "react-native";

let isVisible = false;
const THRESHOLD = 40;
const ScreenHeader = () => {
	const { scrollAnimatedValue } = useListScroll();
	const animatedOpacity = useState(new Animated.Value(0))[0];

	useEffect(() => {
		const scrollListener = scrollAnimatedValue.addListener(({ value }) => {
			if (value > THRESHOLD && !isVisible) {
				Animated.timing(animatedOpacity, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}).start(() => {
					isVisible = true;
				});
			} else if (value < THRESHOLD && isVisible) {
				Animated.timing(animatedOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}).start(() => {
					isVisible = false;
				});
			}
		});

		return () => {
			scrollAnimatedValue.removeListener(scrollListener);
		};
	}, [scrollAnimatedValue]);

	return (
		<Animated.View
			className={"absolute top-0 left-0 right-0 "}
			style={{ opacity: animatedOpacity }}
		>
			<BlurView
				intensity={100}
				className="flex justify-center items-center pt-safe"
			>
				<Text className="px-2 pb-3 text-xl font-semibold">Life Logger</Text>
			</BlurView>
		</Animated.View>
	);
};

export { ScreenHeader };
