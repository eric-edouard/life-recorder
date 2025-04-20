import constate from "constate";
import { useRef } from "react";
import { Animated } from "react-native";

const screenScrollViewContext = () => {
	const scrollAnimatedValue = useRef(new Animated.Value(0)).current;

	return {
		scrollAnimatedValue,
	};
};

export const [ScreenScrollViewProvider, useScreenScroll] = constate(
	screenScrollViewContext,
);
