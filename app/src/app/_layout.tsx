// Keep this at the top of the file
import "react-native-reanimated";
import "../../global.css";

import { TextButton } from "@/src/components/ui/Buttons/TextButton";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import "@/src/tasks/locationTask";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
	fade: true,
});

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ThemeProvider>
			<Stack>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen
					name="modals/device"
					options={{
						presentation: "modal",
						title: "Recording Device",
						headerRight: () => (
							<TextButton title="Done" onPress={router.back} />
						),
					}}
				/>
				<Stack.Screen
					name="modals/device"
					options={{
						presentation: "containedTransparentModal",
						headerShown: false,
						animation: "none",
					}}
				/>

				<Stack.Screen name="+not-found" />
			</Stack>
		</ThemeProvider>
	);
}
