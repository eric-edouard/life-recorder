import { AnimatedScreenHeader } from "@app/components/ScreenScrollView/AnimatedScreenHeader";

import { AnimatedScreenTitle } from "@app/components/ScreenScrollView/AnimatedScreenTitle";
import {
	ScreenScrollViewProvider,
	useScreenScroll,
} from "@app/components/ScreenScrollView/ScreenScrollContext";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";

type ScreenScrollViewProps = {
	title: string;
	children: React.ReactNode;
	className?: string;
};

const Container = ({
	children,
	className,
}: { children: React.ReactNode; className?: string }) => {
	const { scrollAnimatedValue } = useScreenScroll();
	const insets = useSafeAreaInsets();
	return (
		<Animated.ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
				{ useNativeDriver: true },
			)}
			style={{
				paddingTop: insets.top,
			}}
			className={twMerge("flex-1  bg-system-grouped-background", className)}
		>
			{children}
		</Animated.ScrollView>
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
