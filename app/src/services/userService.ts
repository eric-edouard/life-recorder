import { backendUrl } from "@app/src/constants/backendUrl";
import trpc from "@app/src/services/trpc";
import { authClient } from "./authClient";

export const userService = (() => {
	return {
		async listUsers() {
			const response = await trpc.userList.query();
			return response;
		},
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
