import type { TRPCContext } from "@backend/src/services/trpc";
import type { HonoEnv } from "@backend/src/types/honoEnv";
import type { Context as HonoContext } from "hono";

export const createTrpcContext = async (
	_opts: any,
	c: HonoContext<HonoEnv>,
): Promise<TRPCContext> => {
	const session = c.get("session");
	const user = c.get("user");

	return { c, session: session || null, user: user || null };
};
