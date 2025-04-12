import { routes } from "@/routes";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api", routes);

// Server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
