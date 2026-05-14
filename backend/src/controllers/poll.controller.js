import * as pollService from "../services/poll.service.js";
import * as responseService from "../services/response.service.js";
import { emitPollUpdate } from "../config/socket.js";

const getErrorStatus = (error) => {
    const message = error.message || "";
    if (message.includes("Unauthorized")) return 403;
    if (message.includes("not found")) return 404;
    if (message.includes("future") || message.includes("Invalid")) return 400;
    return 500;
};

export const createPoll = async (req, res) => {
    try {
        const userId = req.userId;
        const pollData = req.body;

        const poll = await pollService.createPoll(userId, pollData);

        return res.status(201).json({
            success: true,
            message: "Poll created successfully",
            poll,
        });
    } catch (error) {
        console.error("Error creating poll:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const getPollBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const poll = await pollService.getPollBySlug(slug);

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found",
            });
        }

        const isExpired = pollService.isPollExpired(poll);
        const userId = req.userId;
        const isCreator = poll.createdBy === userId;
        const publicResults = poll.isPublished
            ? await responseService.getPublicPollAnalytics(poll.id)
            : null;

        return res.status(200).json({
            success: true,
            poll: {
                ...poll,
                isExpired,
                canRespond: !poll.isPublished && !isExpired && (poll.isAnonymous || Boolean(userId)),
                requiresAuth: !poll.isAnonymous,
                isCreator,
            },
            publicResults,
        });
    } catch (error) {
        console.error("Error getting poll:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const getUserPolls = async (req, res) => {
    try {
        const userId = req.userId;
        const polls = await pollService.getUserPolls(userId);

        return res.status(200).json({
            success: true,
            polls,
        });
    } catch (error) {
        console.error("Error getting user polls:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const updatePoll = async (req, res) => {
    try {
        const userId = req.userId;
        const { pollId } = req.params;
        const pollData = req.body;

        const poll = await pollService.updatePoll(pollId, userId, pollData);

        return res.status(200).json({
            success: true,
            message: "Poll updated successfully",
            poll,
        });
    } catch (error) {
        console.error("Error updating poll:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const publishPoll = async (req, res) => {
    try {
        const userId = req.userId;
        const { pollId } = req.params;

        const poll = await pollService.publishPoll(pollId, userId);
        const analytics = await responseService.getPublicPollAnalytics(poll.id);

        emitPollUpdate(poll.id, "poll-published", { analytics });

        return res.status(200).json({
            success: true,
            message: "Poll published successfully",
            poll,
        });
    } catch (error) {
        console.error("Error publishing poll:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const deletePoll = async (req, res) => {
    try {
        const userId = req.userId;
        const { pollId } = req.params;

        await pollService.deletePoll(pollId, userId);

        return res.status(200).json({
            success: true,
            message: "Poll deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting poll:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const getPollAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        const { pollId } = req.params;

        const analytics = await responseService.getPollAnalytics(pollId, userId);

        return res.status(200).json({
            success: true,
            analytics,
        });
    } catch (error) {
        console.error("Error getting analytics:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export const getPollResponses = async (req, res) => {
    try {
        const userId = req.userId;
        const { pollId } = req.params;

        const responses = await responseService.getPollResponses(pollId, userId);

        return res.status(200).json({
            success: true,
            responses,
        });
    } catch (error) {
        console.error("Error getting responses:", error);
        return res.status(getErrorStatus(error)).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
