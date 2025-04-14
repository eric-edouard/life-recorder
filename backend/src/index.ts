// Register module aliases
import "module-alias/register";

import { createServer } from "node:http";
import { routes } from "@/routes";
import { forwardLogsMiddleware } from "@/services/socketMiddlewares/forwardLogsMiddleware";
import { handleAudioMiddleware } from "@/services/socketMiddlewares/handleAudioMiddleware";
import { socketService } from "@/services/socketService";
import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
socketService.initialize(server);
socketService.use(handleAudioMiddleware);
socketService.use(forwardLogsMiddleware);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(routes);

// Server
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log("Socket.IO server is running");
});
