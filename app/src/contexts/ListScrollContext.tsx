import constate from "constate";
import { useRef } from "react";
import { Animated } from "react-native";

const listScrollContext = () => {
	const scrollAnimatedValue = useRef(new Animated.Value(0)).current;

	return {
		scrollAnimatedValue,
	};
};

export const [ListScrollProvider, useListScroll] = constate(listScrollContext);
