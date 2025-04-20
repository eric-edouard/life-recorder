import { AnimatedScreenHeader } from "@/src/components/ScreenScrollView/AnimatedScreenHeader";

import { AnimatedScreenTitle } from "@/src/components/ScreenScrollView/AnimatedScreenTitle";
import {
	ScreenScrollViewProvider,
	useScreenScroll,
} from "@/src/components/ScreenScrollView/ScreenScrollContext";
import { Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenScrollViewProps = {
	title: string;
	children: React.ReactNode;
};

const Container = ({ children }: { children: React.ReactNode }) => {
	const { scrollAnimatedValue } = useScreenScroll();
	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
				{ useNativeDriver: false },
			)}
			style={{
				paddingTop: insets.top + 44,
			}}
			className="flex-1 bg-system-background "
		>
			{children}
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
