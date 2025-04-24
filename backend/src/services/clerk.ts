import { createClerkClient } from "@clerk/backend";

if (!process.env.CLERK_SECRET_KEY) {
	throw new Error("CLERK_SECRET_KEY is not set");
}

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});
