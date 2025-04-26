import type { auth } from "@backend/src/auth";
import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";

// Define context type
export interface Context {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
	transformer: SuperJSON,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
