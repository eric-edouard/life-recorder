import { auth } from "@backend/src/auth";
import type { TypedSocket } from "@backend/src/types/socket-events";
import { fromNodeHeaders } from "better-auth/node";
import type { ExtendedError } from "socket.io";

export const authenticateSocket = async (
	socket: TypedSocket,
	next: (err?: ExtendedError) => void,
) => {
	try {
		const rawCookies = socket.handshake.auth.cookies;
		if (!rawCookies) {
			return next(new Error("No cookies provided"));
		}

		const session = await auth.api.getSession({
			headers: fromNodeHeaders({
				cookie: rawCookies,
			}),
		});

		if (!session) {
			return next(new Error("Invalid session token"));
		}

		socket.data.auth = session;
		next();
	} catch (error) {
		console.error("Authentication error:", error);
		next(new Error("Authentication failed"));
	}
};
