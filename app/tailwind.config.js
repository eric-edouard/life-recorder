/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all of your component files.
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				"background-level-1": "var(--background-level-1)",
				"background-level-2": "var(--background-level-2)",
				foreground: "var(--foreground)",
				"foreground-muted": "var(--foreground-muted)",
				"foreground-subtle": "var(--foreground-subtle)",
				primary: "var(--primary)",
				green: "var(--green)",
				yellow: "var(--yellow)",
				red: "var(--red)",
			},
		},
	},
	plugins: [],
};

// import { vars } from "nativewind";

// export const themes = {
// 	light: vars({
// 		"--background": "#FCFDFD",
// 		"--foreground": "#1E1E1E",
// 		"--foreground-muted": "#979797",
// 		"--foreground-subtle": "#666666",
// 		"--primary": "#3a5e96",
// 		"--destructive": "#ff88bd",
// 	}),
// 	dark: vars({
// 		"--background": "#1E1E1E",
// 		"--foreground": "#FCFDFD",
// 		"--foreground-muted": "#979797",
// 		"--foreground-subtle": "#666666",
// 		"--primary": "#5bd1e7",
// 		"--destructive": "#ff88bd",
// 	}),
// };
