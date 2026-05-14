import * as responseService from "../services/response.service.js";
import * as pollService from "../services/poll.service.js";
import { emitPollUpdate } from "../config/socket.js";

const getErrorStatus = (error) => {
    const message = error.message || "";
    if (message.includes("not found")) return 404;
    if (message.includes("Login is required")) return 401;
    if (
        message.includes("expired") ||
        message.includes("required") ||
        message.includes("Mandatory") ||
        message.includes("Invalid") ||
        message.includes("already")
    ) {
        return 400;
    }
    if (message.includes("published yet")) return 403;
    return 500;
};

export const submitResponse = async (req, res) => {
    try {
        const { slug } = req.params;
        const { answers } = req.body;
        const respondentId = req.userId || null; // null if anonymous

        const poll = await pollService.getPollBySlug(slug);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found",
            });
        }

        const response = await responseService.submitResponse(slug, answers, respondentId);
        const analytics = await responseService.getPublicPollAnalytics(response.pollId);

        emitPollUpdate(response.pollId, "response-update", {
            responseCount: analytics.totalResponses,
            analytics,
        });

        return res.status(201).json({
            success: true,
            message: "Response submitted successfully",
            response,
        });
    } catch (error) {
        console.error("Error submitting response:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const getPublicResults = async (req, res) => {
    try {
        const { slug } = req.params;

        const poll = await pollService.getPollBySlug(slug);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found",
            });
        }

        if (!poll.isPublished) {
            return res.status(403).json({
                success: false,
                message: "Poll results are not published yet",
            });
        }

        const analytics = await responseService.getPublicPollAnalytics(poll.id);

        return res.status(200).json({
            success: true,
            analytics,
        });
    } catch (error) {
        console.error("Error getting results:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
