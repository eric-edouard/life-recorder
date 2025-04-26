import { backendUrl } from "@app/src/constants/backendUrl";
import { authClient } from "@app/src/services/authClient";
import type { AppRouter } from "@backend/src/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${backendUrl}/trpc`,
			headers: () => {
				const headers = new Map<string, string>();
				const cookies = authClient.getCookie();
				if (cookies) {
					headers.set("Cookie", cookies);
				}
				return Object.fromEntries(headers);
			},
			transformer: SuperJSON,
		}),
	],
});

export default trpc;
