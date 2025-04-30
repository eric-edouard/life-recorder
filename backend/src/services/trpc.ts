import type { HonoEnv } from "@backend/src/types/honoEnv";
import { TRPCError, initTRPC } from "@trpc/server";
import type SuperJSON from "superjson";
const superjson: SuperJSON = require("fix-esm").require("superjson");

// Define context type
export interface TRPCContext {
	session: HonoEnv["Variables"]["session"] | null;
	user: HonoEnv["Variables"]["user"] | null;
	[key: string]: any;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
	async function isAuthed(opts) {
		const { ctx } = opts;
		if (!ctx.session || !ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return opts.next({
			ctx: {
				session: ctx.session,
				user: ctx.user,
			},
		});
	},
);

export const timingMiddleware = t.middleware(async ({ path, type, next }) => {
	const start = Date.now();
	const result = await next();
	const durationMs = Date.now() - start;

	console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);

	return result;
});
