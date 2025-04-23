import {
	type CustomColorName,
	customColors,
	customColorsVars,
} from "@app/constants/customColors";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
	type Theme,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import type React from "react";
import { createContext, useContext } from "react";
import { View, useColorScheme } from "react-native";
import { useCurrentColorsVariants } from "react-native-uikit-colors";
interface ThemeProviderProps {
	children: React.ReactNode;
}
export const ThemeContext = createContext<{
	theme: "light" | "dark";
}>({
	theme: "light",
});

SystemUI.setBackgroundColorAsync("black");

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const colorScheme = useColorScheme();
	const currentThemeColors = useCurrentColorsVariants();

	const customiseNavigationTheme = (t: Theme) => {
		return {
			...t,
			colors: {
				...t.colors,
				primary: customColors[colorScheme ?? "dark"]["--accent"],
			},
		} as Theme;
	};

	return (
		<ThemeContext.Provider value={{ theme: colorScheme ?? "dark" }}>
			<NavigationThemeProvider
				value={customiseNavigationTheme(
					colorScheme === "dark" ? DarkTheme : DefaultTheme,
				)}
			>
				<View
					style={[customColorsVars[colorScheme ?? "dark"], currentThemeColors]}
					className="flex-1"
				>
					{children}
				</View>
			</NavigationThemeProvider>
		</ThemeContext.Provider>
	);
};

export const useCustomColors = () => {
	const { theme } = useContext(ThemeContext);
	return customColors[theme];
};

export const useCustomColor = (color: CustomColorName) => {
	const { theme } = useContext(ThemeContext);
	return customColors[theme][color];
};
