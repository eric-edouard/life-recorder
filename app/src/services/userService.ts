import { backendUrl } from "@app/constants/backendUrl";
import { authClient } from "./authClient";

export const userService = (() => {
	return {
		async getUser() {
			const response = await fetch(`${backendUrl}/api/me`, {
				headers: {
					Cookie: authClient.getCookie(),
				},
			});
			return response.json();
		},
	};
})();
