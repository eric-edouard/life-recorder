// Register module aliases
import "module-alias/register";

import { routes } from "@/routes";
import { logService } from "@/services/logService";
import { audioSocketService } from "@/services/socket/AudioSocketService";
import { socketService } from "@/services/socket/socket";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
socketService.initialize(server);
socketService.use(audioSocketService);
socketService.use(logService);

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
