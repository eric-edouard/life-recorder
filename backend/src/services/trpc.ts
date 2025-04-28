import type { auth } from "@backend/src/auth";
import { TRPCError, initTRPC } from "@trpc/server";
import type SuperJSON from "superjson";
const superjson: SuperJSON = require("fix-esm").require("superjson");

// Define context type
export interface Context {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
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
		if (!ctx.session?.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return opts.next({
			ctx: {
				session: ctx.session,
			},
		});
	},
);
