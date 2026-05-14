import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import responseRoutes from "./routes/response.routes.js";
import { corsOptions } from "./config/cors.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/responses", responseRoutes);

// Health check route
app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

export default app;
