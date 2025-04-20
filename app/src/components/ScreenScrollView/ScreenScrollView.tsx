import { AnimatedScreenHeader } from "@/src/components/ScreenScrollView/AnimatedScreenHeader";

import { AnimatedScreenTitle } from "@/src/components/ScreenScrollView/AnimatedScreenTitle";
import {
	ScreenScrollViewProvider,
	useScreenScroll,
} from "@/src/components/ScreenScrollView/ScreenScrollContext";
import { Animated, ScrollView, View } from "react-native";

type ScreenScrollViewProps = {
	title: string;
	children: React.ReactNode;
};

const Container = ({ children }: { children: React.ReactNode }) => {
	const { scrollAnimatedValue } = useScreenScroll();

	return (
		<ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
				{ useNativeDriver: false },
			)}
		>
			<View className="flex-1 bg-system-background">{children}</View>
		</ScrollView>
	);
};

const ContainerWithProvider = ({ title, children }: ScreenScrollViewProps) => {
	return (
		<ScreenScrollViewProvider>
			<Container>{children}</Container>
			<AnimatedScreenHeader title={title} />
		</ScreenScrollViewProvider>
	);
};

export const ScreenScrollView = {
	Container: ContainerWithProvider,
	Title: AnimatedScreenTitle,
	useScreenScroll,
};
