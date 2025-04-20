import { withUIKit } from 'react-native-uikit-colors/tailwind';

/** @type {import('tailwindcss').Config} */
module.exports = withUIKit({
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				// Custom colors
				accent: "var(--accent)",
			},
		},
	},
	plugins: [
		({ addComponents }) => {
			/**
			 * Debug utilities
			 */
			addComponents({
				".d": {
					borderWidth: "1px",
					borderColor: "var(--red)",
					borderStyle: "solid",
				},
				".d1": {
					borderWidth: "1px",
					borderColor: "var(--primary)",
					borderStyle: "solid",
				},
				".d2": {
					borderWidth: "1px",
					borderColor: "var(--yellow)",
					borderStyle: "solid",
				},
			});
		},
	],
});
