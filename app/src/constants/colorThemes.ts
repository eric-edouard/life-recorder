import { vars } from "nativewind";

export const colorThemes = {
	light: vars({
		"--background": "#FFFFFF", // systemBackground
		"--background-muted": "#F2F2F7", // secondarySystemBackground
		"--background-subtle": "#E5E5EA", // tertiarySystemBackground
		"--foreground": "#000000", // label
		"--foreground-muted": "#3C3C43", // secondaryLabel
		"--foreground-subtle": "#3C3C4399", // tertiaryLabel
		"--primary": "#007AFF", // systemBlue
		"--green": "#34C759", // systemGreen
		"--yellow": "#FFCC00", // systemYellow
		"--red": "#FF3B30", // systemRed
	}),
	dark: vars({
		"--background": "#000000", // systemBackground
		"--background-muted": "#1C1C1E", // secondarySystemBackground
		"--background-subtle": "#2C2C2E", // tertiarySystemBackground
		"--foreground": "#FFFFFF", // label
		"--foreground-muted": "#EBEBF5", // secondaryLabel
		"--foreground-subtle": "#EBEBF599", // tertiaryLabel
		"--primary": "#0A84FF", // systemBlue (dark)
		"--green": "#30D158", // systemGreen (dark)
		"--yellow": "#FFD60A", // systemYellow (dark)
		"--red": "#FF453A", // systemRed (dark)
	}),
};
