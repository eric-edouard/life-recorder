import { backendUrl } from "@app/constants/backendUrl";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: backendUrl,
	plugins: [
		expoClient({
			scheme: "life-recorder",
			storagePrefix: "life-recorder",
			storage: SecureStore,
		}),
	],
});
