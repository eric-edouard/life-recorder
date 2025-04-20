import { withUIKit } from "react-native-uikit-colors/tailwind";
import { withAccentColor } from "./utils/withAccentColor";
const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = withAccentColor(withUIKit({
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			height: {
				row: 44,
			},
			padding: {
				sm: 8,
				md: 16,
				lg: 20
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
					borderColor: "red",
					borderStyle: "solid",
				},
				".d1": {
					borderWidth: "1px",
					borderColor: "blue",
					borderStyle: "solid",
				},
				".d2": {
					borderWidth: "1px",
					borderColor: "yellow",
					borderStyle: "solid",
				},
			});
		},
	],
}));
