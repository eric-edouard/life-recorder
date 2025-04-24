// Keep this at the top of the file
import "react-native-reanimated";
import "../../global.css";

import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import { ThemeProvider } from "@app/contexts/ThemeContext";
import "@app/tasks/locationTask";
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
		<ClerkProvider tokenCache={tokenCache}>
			<ThemeProvider>
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen
						name="modals/device"
						options={{
							presentation: "containedTransparentModal",
							headerShown: false,
							animation: "none",
						}}
					/>

					<Stack.Screen name="+not-found" />
					<Stack.Screen
						name="user"
						options={{
							headerBackTitle: "Home",
							headerTitle: "User",
						}}
					/>
				</Stack>
			</ThemeProvider>
		</ClerkProvider>
	);
}
