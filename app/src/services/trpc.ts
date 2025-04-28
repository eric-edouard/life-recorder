import { backendUrl } from "@app/src/constants/backendUrl";
import { authClient } from "@app/src/services/authClient";
import { queryClient } from "@app/src/services/reactQuery";
import type { AppRouter } from "@backend/src/index";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) => process.env.NODE_ENV === "development",
			colorMode: "ansi",
		}),
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

export const trpcQuery = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
