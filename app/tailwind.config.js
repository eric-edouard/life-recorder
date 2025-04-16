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
				"foreground-level-1": "var(--foreground-level-1)",
				"foreground-level-2": "var(--foreground-level-2)",
				"foreground-level-3": "var(--foreground-level-3)",
				primary: "var(--primary)",
				green: "var(--green)",
				yellow: "var(--yellow)",
				red: "var(--red)",
			},
		},
	},
	plugins: [
		({ addComponents }) => {
			/**
			 * Debug utilities
			 */
			addComponents({
				'.d': {
					borderWidth: '1px',
					borderColor: 'var(--red)',
					borderStyle: 'solid',
				},
				'.d1': {
					borderWidth: '1px',
					borderColor: 'var(--primary)',
					borderStyle: 'solid',
				},
				'.d2': {
					borderWidth: '1px',
					borderColor: 'var(--yellow)',
					borderStyle: 'solid',
				},
			});
		},
	],
};