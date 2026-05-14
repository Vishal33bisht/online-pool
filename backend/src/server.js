import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

io.on("connection",(socket)=>{
    console.log("User Connected:",socket.id);

    socket.on("disconnect",()=>{
        console.log("User disconnected");
    });
});

const PORT=process.env.PORT || 5000;

server.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`);
});