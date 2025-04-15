import { colorThemes } from "@/src/constants/colorThemes";
// import { useColorScheme } from "nativewind";
import type React from "react";
import { createContext } from "react";
import { View, useColorScheme } from "react-native";

interface ThemeProviderProps {
	children: React.ReactNode;
}
export const ThemeContext = createContext<{
	theme: "light" | "dark";
}>({
	theme: "light",
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const colorScheme = useColorScheme();

	return (
		<ThemeContext.Provider value={{ theme: colorScheme ?? "dark" }}>
			<View style={colorThemes[colorScheme ?? "dark"]} className="flex-1">
				{children}
			</View>
		</ThemeContext.Provider>
	);
};
