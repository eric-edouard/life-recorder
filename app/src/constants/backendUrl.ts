// Try to use local backend URL in development build, fall back to environment variable
import * as DevClient from "expo-dev-client";

let backendUrl: string;

// Only use local backend URL in development builds
if (DevClient.isDevelopmentBuild()) {
	try {
		// This file will be gitignored and can be overwritten by the backend script
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const localConfig = require("./localBackendUrl");
		backendUrl = localConfig.backendUrl;
	} catch (error) {
		// Fallback to environment variable if local file doesn't exist
		if (!process.env.EXPO_PUBLIC_BACKEND_URL) {
			throw new Error("EXPO_PUBLIC_BACKEND_URL is not set");
		}
		backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
	}
} else {
	// Always use environment variable in production builds
	if (!process.env.EXPO_PUBLIC_BACKEND_URL) {
		throw new Error("EXPO_PUBLIC_BACKEND_URL is not set");
	}
	backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
}

export { backendUrl };
