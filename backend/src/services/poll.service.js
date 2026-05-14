import prisma from "../config/prisma.js";
import slugify from "slugify";

const getPollInclude = (includeResponses = false) => ({
    questions: {
        orderBy: { order: "asc" },
        include: {
            options: {
                orderBy: { order: "asc" },
            },
            responses: includeResponses ? { select: { id: true } } : false,
        },
    },
    creator: {
        select: { id: true, name: true, email: true },
    },
    responses: includeResponses ? { select: { id: true } } : false,
});

const normalizeExpiry = (expiresAt) => {
    if (!expiresAt) return null;

    const date = new Date(expiresAt);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid expiry date");
    }

    if (date <= new Date()) {
        throw new Error("Expiry time must be in the future");
    }

    return date;
};

export const createPoll = async (userId, pollData) => {
    try {
        const { title, description, isAnonymous, expiresAt, questions } = pollData;
        
        // Generate unique slug
        let slug = slugify(title, { lower: true, strict: true }) || `poll-${Date.now()}`;
        let counter = 0;
        let uniqueSlug = slug;
        
        while (await prisma.poll.findUnique({ where: { slug: uniqueSlug } })) {
            counter++;
            uniqueSlug = `${slug}-${counter}`;
        }

        // Create poll with questions and options
        const poll = await prisma.poll.create({
            data: {
                title,
                description,
                isAnonymous: Boolean(isAnonymous),
                expiresAt: normalizeExpiry(expiresAt),
                slug: uniqueSlug,
                createdBy: userId,
                questions: {
                    create: questions.map((question, qIndex) => ({
                        text: question.text,
                        isMandatory: Boolean(question.isMandatory),
                        order: qIndex,
                        options: {
                            create: question.options.map((option, oIndex) => ({
                                text: option.text,
                                order: oIndex,
                            })),
                        },
                    })),
                },
            },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        return poll;
    } catch (error) {
        console.error("Error creating poll:", error);
        throw error;
    }
};

export const getPollBySlug = async (slug, includeResponses = false) => {
    try {
        const poll = await prisma.poll.findUnique({
            where: { slug },
            include: getPollInclude(includeResponses),
        });

        return poll;
    } catch (error) {
        console.error("Error getting poll:", error);
        throw error;
    }
};

export const getPollById = async (id, includeResponses = false) => {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id },
            include: getPollInclude(includeResponses),
        });

        return poll;
    } catch (error) {
        console.error("Error getting poll:", error);
        throw error;
    }
};

export const getUserPolls = async (userId) => {
    try {
        const polls = await prisma.poll.findMany({
            where: { createdBy: userId },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
                _count: {
                    select: { responses: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return polls;
    } catch (error) {
        console.error("Error getting user polls:", error);
        throw error;
    }
};

export const updatePoll = async (pollId, userId, pollData) => {
    try {
        // Verify ownership
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || poll.createdBy !== userId) {
            throw new Error("Unauthorized - Not poll creator");
        }

        const data = {};
        if (Object.prototype.hasOwnProperty.call(pollData, "title")) data.title = pollData.title;
        if (Object.prototype.hasOwnProperty.call(pollData, "description")) data.description = pollData.description;
        if (Object.prototype.hasOwnProperty.call(pollData, "isAnonymous")) data.isAnonymous = pollData.isAnonymous;
        if (Object.prototype.hasOwnProperty.call(pollData, "expiresAt")) data.expiresAt = normalizeExpiry(pollData.expiresAt);

        const updatedPoll = await prisma.poll.update({
            where: { id: pollId },
            data,
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        return updatedPoll;
    } catch (error) {
        console.error("Error updating poll:", error);
        throw error;
    }
};

export const publishPoll = async (pollId, userId) => {
    try {
        // Verify ownership
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || poll.createdBy !== userId) {
            throw new Error("Unauthorized - Not poll creator");
        }

        const updatedPoll = await prisma.poll.update({
            where: { id: pollId },
            data: { isPublished: true },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        return updatedPoll;
    } catch (error) {
        console.error("Error publishing poll:", error);
        throw error;
    }
};

export const deletePoll = async (pollId, userId) => {
    try {
        // Verify ownership
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || poll.createdBy !== userId) {
            throw new Error("Unauthorized - Not poll creator");
        }

        await prisma.poll.delete({ where: { id: pollId } });

        return { success: true };
    } catch (error) {
        console.error("Error deleting poll:", error);
        throw error;
    }
};

export const isPollExpired = (poll) => {
    if (!poll.expiresAt) return false;
    return new Date() > new Date(poll.expiresAt);
};
