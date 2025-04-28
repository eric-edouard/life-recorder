import { auth } from "@backend/src/auth";
import type { Context } from "@backend/src/services/trpc";
import type * as trpcExpress from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";

export const createContext = async ({
	req,
	res,
}: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	return { session };
};
