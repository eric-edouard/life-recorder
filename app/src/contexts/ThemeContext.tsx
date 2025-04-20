import {
	type CustomColorName,
	customColors,
	customColorsVars,
} from "@/src/constants/customColors";
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

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const colorScheme = useColorScheme();
	const currentThemeColors = useCurrentColorsVariants();

	return (
		<ThemeContext.Provider value={{ theme: colorScheme ?? "dark" }}>
			<View
				style={[customColorsVars[colorScheme ?? "dark"], currentThemeColors]}
				className="flex-1"
			>
				{children}
			</View>
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
