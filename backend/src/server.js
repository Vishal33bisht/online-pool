import dotenv from "dotenv";
dotenv.config();

import http from "http";

import app from "./app.js";
import { initSocket } from "./config/socket.js";

const server = http.createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});

export { io, server };
