import "dotenv/config";

import { routes } from "@backend/routes";
import { socketService } from "@backend/services/socketService";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { auth } from "./auth";

const app = express();
const PORT = process.env.PORT || 3000;

app.all("/api/auth/*", toNodeHandler(auth));

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
