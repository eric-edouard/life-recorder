import "dotenv/config";

import { routes } from "@backend/routes";
import { socketService } from "@backend/services/socketService";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

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
