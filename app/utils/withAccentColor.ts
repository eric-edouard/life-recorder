import type { Config } from "tailwindcss";

export const withAccentColor = (config: Config): Config => {
	const extendedConfig = { ...config };

	// Ensure theme and extend objects exist
	if (!extendedConfig.theme) {
		extendedConfig.theme = {};
	}

	if (!extendedConfig.theme.extend) {
		extendedConfig.theme.extend = {};
	}

	// Ensure colors object exists in theme.extend
	if (!extendedConfig.theme.extend.colors) {
		extendedConfig.theme.extend.colors = {};
	}

	// Add or override the red color with our accent variable
	extendedConfig.theme.extend.colors = {
		...extendedConfig.theme.extend.colors,
		red: "var(--accent)",
	};

	return extendedConfig;
};
