import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

const isSignedIn = false;

export default function TabLayout() {
	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />;
	}
	const colorScheme = useColorScheme();
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				animation: "fade",
				tabBarStyle: {
					borderTopWidth: colorScheme === "dark" ? 0 : StyleSheet.hairlineWidth,
					position: "absolute",
				},
				tabBarBackground: () => (
					<BlurView
						intensity={100}
						style={{
							...StyleSheet.absoluteFillObject,
							backgroundColor: "transparent",
						}}
					/>
				),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Live",
					tabBarIcon: ({ focused, color }) => (
						<SymbolView
							name={focused ? "microphone.fill" : "microphone"}
							animationSpec={
								focused
									? {
											effect: {
												type: "bounce",
											},
										}
									: undefined
							}
							tintColor={color}
							weight={"medium"}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ focused, color }) => (
						<SymbolView
							name={"clock.arrow.trianglehead.counterclockwise.rotate.90"}
							animationSpec={
								focused
									? {
											effect: {
												type: "bounce",
											},
										}
									: undefined
							}
							tintColor={color}
							weight={focused ? "bold" : "medium"}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
