import { vars } from "nativewind";

const colorsNames = ["--accent"] as const;

export type CustomColorName = (typeof colorsNames)[number];

export const lightColors: Record<CustomColorName, string> = {
	"--accent": "#DE0000",
};

export const darkColors: Record<CustomColorName, string> = {
	"--accent": "#CD0D02",
};

export const customColors = {
	light: lightColors,
	dark: darkColors,
};

export const customColorsVars = {
	light: vars(lightColors),
	dark: vars(darkColors),
};
