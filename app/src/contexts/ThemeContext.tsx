import {
	type ColorName,
	colorThemes,
	darkColors,
	lightColors,
} from "@/src/constants/colorThemes";
import type React from "react";
import { createContext, useContext } from "react";
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

export const useThemeColor = (color: ColorName) => {
	const { theme } = useContext(ThemeContext);

	return theme === "light" ? lightColors[color] : darkColors[color];
};
