// Register module aliases
import "module-alias/register";

import { createServer } from "node:http";
import { routes } from "@/routes";
import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increase limit for audio data

// Routes
app.use(routes);

// Server - listen on IPv6 for Railway private networking
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
