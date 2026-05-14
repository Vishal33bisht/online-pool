export const allowedOrigins =["http://localhost:5173","https://online-pool.vercel.app"]
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
};
