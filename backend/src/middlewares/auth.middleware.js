import jwt from "jsonwebtoken";

const getTokenFromRequest = (req) => {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;

    return req.cookies.token || bearerToken;
};

const authMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Invalid token"
        });
    }
};

export const optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        }

        next();
    } catch (error) {
        next();
    }
};

export default authMiddleware;
