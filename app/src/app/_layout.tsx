// Keep this at the top of the file
import "react-native-reanimated";
import "../../global.css";

import "@/src/tasks/locationTask";

import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
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
				<Stack.Screen name="modal" options={{ presentation: "modal" }} />
				<Stack.Screen
					name="pair-device"
					options={{ title: "Pair Device", headerBackTitle: "Home" }}
				/>
				<Stack.Screen name="+not-found" />
			</Stack>
		</ThemeProvider>
	);
}
