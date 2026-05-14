import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join-poll", (pollId) => {
            socket.join(`poll-${pollId}`);
        });

        socket.on("leave-poll", (pollId) => {
            socket.leave(`poll-${pollId}`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => io;

export const emitPollUpdate = (pollId, event, payload) => {
    if (!io || !pollId) return;
    io.to(`poll-${pollId}`).emit(event, {
        pollId,
        ...payload,
        timestamp: new Date().toISOString(),
    });
};
