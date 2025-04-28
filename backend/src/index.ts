import { createAppServer } from "@backend/src/server";
import "dotenv/config";

const server = createAppServer();

// Start server
server.listen(process.env.PORT || 3000, () => {
	console.log(`Server is running on port ${process.env.PORT || 3000}`);
	console.log("Socket.IO server is running");
});

// Export routers for client use
export { appRouter } from "@backend/src/trpc/appRouter";
export type { AppRouter } from "@backend/src/trpc/appRouter";
