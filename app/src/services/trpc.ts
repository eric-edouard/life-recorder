import { backendUrl } from "@app/constants/backendUrl";
import { authClient } from "@app/services/authClient";
import type { AppRouter } from "@backend/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: backendUrl,
			headers: () => {
				const headers = new Map<string, string>();
				const cookies = authClient.getCookie();
				if (cookies) {
					headers.set("Cookie", cookies);
				}
				return Object.fromEntries(headers);
			},
		}),
	],
});

export default trpc;
