import { vars } from "nativewind";

const colorsNames = [
	"--background",
	"--background-level-1",
	"--background-level-2",
	"--foreground",
	"--foreground-level-1",
	"--foreground-level-2",
	"--foreground-level-3",
	"--primary",
	"--green",
	"--yellow",
	"--red",
] as const;

export type ColorName = (typeof colorsNames)[number];

export const lightColors: Record<ColorName, string> = {
	"--background": "#FFFFFF", // systemBackground
	"--background-level-1": "#F2F2F7", // secondarySystemBackground
	"--background-level-2": "#E5E5EA", // tertiarySystemBackground
	"--foreground": "#000000", // label
	"--foreground-level-1": "#3C3C43", // secondaryLabel
	"--foreground-level-2": "#3C3C4399", // tertiaryLabel
	"--foreground-level-3": "#3C3C4366", // quaternaryLabel
	"--primary": "#007AFF", // systemBlue
	"--green": "#34C759", // systemGreen
	"--yellow": "#FFCC00", // systemYellow
	"--red": "#FF3B30", // systemRed
};

export const darkColors: Record<ColorName, string> = {
	"--background": "#000000", // systemBackground
	"--background-level-1": "#1C1C1E", // secondarySystemBackground
	"--background-level-2": "#2C2C2E", // tertiarySystemBackground
	"--foreground": "#F2F2F7", // label
	"--foreground-level-1": "#D1D1D1", // secondaryLabel
	"--foreground-level-2": "#EBEBF599", // tertiaryLabel
	"--foreground-level-3": "#EBEBF566", // quaternaryLabel
	"--primary": "#0A84FF", // systemBlue (dark)
	"--green": "#30D158", // systemGreen (dark)
	"--yellow": "#FFD60A", // systemYellow (dark)
	"--red": "#FF453A", // systemRed (dark)
};

export const colorThemes = {
	light: vars(lightColors),
	dark: vars(darkColors),
};
