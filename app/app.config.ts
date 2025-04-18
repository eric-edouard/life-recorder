import type { ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

const getUniqueIdentifier = () => {
	if (IS_DEV) {
		return "com.eamilhat.life-recorder.dev";
	}
	return "com.eamilhat.life-recorder";
};

const getAppName = () => {
	if (IS_DEV) {
		return "life-recorder-dev";
	}
	return "life-recorder";
};

export default ({ config }: ConfigContext) => ({
	...config,
	expo: {
		name: getAppName(),
		slug: "life-recorder",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/images/icon.png",
		scheme: "life-recorder",
		userInterfaceStyle: "automatic",
		newArchEnabled: true,
		ios: {
			backgroundColor: "#FFFFFF",
			supportsTablet: false,
			bundleIdentifier: getUniqueIdentifier(),
			appleTeamId: "6A3W99PM43",
			infoPlist: {
				ITSAppUsesNonExemptEncryption: false,
			},
			icon: {
				light: "./assets/images/ios-light.png",
				dark: "./assets/images/ios-dark.png",
				tinted: "./assets/images/ios-tinted.png",
			},
		},
		android: {
			package: getUniqueIdentifier(),
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#FFFFFF",
			},
			permissions: [
				"android.permission.RECORD_AUDIO",
				"android.permission.MODIFY_AUDIO_SETTINGS",
				"android.permission.ACCESS_COARSE_LOCATION",
				"android.permission.ACCESS_FINE_LOCATION",
				"android.permission.BLUETOOTH",
				"android.permission.BLUETOOTH_ADMIN",
				"android.permission.BLUETOOTH_CONNECT",
			],
		},
		web: {
			bundler: "metro",
		},
		plugins: [
			"expo-router",
			[
				"expo-splash-screen",
				{
					image: "./assets/images/splash-icon-light.png",
					imageWidth: 200,
					resizeMode: "contain",
					backgroundColor: "#FFFFFF",
					dark: {
						image: "./assets/images/splash-icon-dark.png",
						backgroundColor: "#000000",
					},
				},
			],
			"expo-font",
			"expo-audio",
			[
				"expo-location",
				{
					locationAlwaysAndWhenInUsePermission:
						"Allow $(PRODUCT_NAME) to use your location.",
				},
			],
			"react-native-ble-plx",
			"expo-av",
			"react-native-vad",
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {
				origin: false,
			},
			eas: {
				projectId: "a8942c44-d410-474f-84f6-1756e6df48ca",
			},
		},
		runtimeVersion: {
			policy: "appVersion",
		},
		updates: {
			url: "https://u.expo.dev/a8942c44-d410-474f-84f6-1756e6df48ca",
		},
	},
});
