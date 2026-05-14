import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

const app=express();

app.use(
    cors({
        origin:process.env.CLIENT_URL,
        credentials:true,
    })
);
app.use("/api/auth",authRoutes);

app.use(express.json());
app.use(cookieParser());

export default app;