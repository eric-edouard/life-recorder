// Keep this at the top of the file
import "react-native-reanimated";
import "../../global.css";

import { ThemeProvider } from "@app/src/contexts/ThemeContext";
import { queryClient } from "@app/src/services/reactQuery";
import "@app/src/tasks/locationTask";
import { prefetch } from "@app/src/utils/prefetch";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
	fade: true,
});

prefetch();

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
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<Stack>
					<Stack.Screen
						name="(tabs)"
						options={{ headerShown: false, headerTitle: "Home" }}
					/>
					<Stack.Screen
						name="(auth)"
						options={{
							headerShown: false,
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
					<Stack.Screen
						name="modals/voice-profile"
						options={{
							presentation: "containedTransparentModal",
							headerShown: false,
							animation: "none",
						}}
					/>
					<Stack.Screen
						name="modals/record-voice-profile"
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
							headerTitle: "User",
						}}
					/>
				</Stack>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
