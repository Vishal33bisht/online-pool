import prisma from "../config/prisma.js";
import { isPollExpired } from "./poll.service.js";

const pollAnalyticsInclude = {
    questions: {
        orderBy: { order: "asc" },
        include: {
            options: {
                orderBy: { order: "asc" },
            },
        },
    },
    responses: {
        include: {
            questionResponses: true,
            respondent: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: "desc" },
    },
};

const buildAnalytics = (poll) => {
    const totalResponses = poll.responses.length;
    const totalQuestions = poll.questions.length;
    const mandatoryQuestionCount = poll.questions.filter((question) => question.isMandatory).length;
    const totalAnswered = poll.responses.reduce(
        (sum, response) => sum + response.questionResponses.length,
        0
    );
    const possibleAnswers = totalResponses * totalQuestions;
    const authenticatedResponses = poll.responses.filter((response) => response.respondentId).length;

    return {
        totalResponses,
        pollDetails: {
            id: poll.id,
            title: poll.title,
            slug: poll.slug,
            description: poll.description,
            isAnonymous: poll.isAnonymous,
            isPublished: poll.isPublished,
            isExpired: isPollExpired(poll),
            expiresAt: poll.expiresAt,
            createdAt: poll.createdAt,
        },
        participation: {
            totalQuestions,
            mandatoryQuestionCount,
            optionalQuestionCount: totalQuestions - mandatoryQuestionCount,
            authenticatedResponses,
            anonymousResponses: totalResponses - authenticatedResponses,
            averageCompletionRate: possibleAnswers
                ? Number(((totalAnswered / possibleAnswers) * 100).toFixed(2))
                : 0,
            latestResponseAt: poll.responses[0]?.createdAt || null,
        },
        questions: poll.questions.map((question) => {
            const answeredCount = poll.responses.filter((response) =>
                response.questionResponses.some((answer) => answer.questionId === question.id)
            ).length;

            const options = question.options.map((option) => {
                const count = poll.responses.filter((response) =>
                    response.questionResponses.some((answer) => answer.selectedOptionId === option.id)
                ).length;

                return {
                    id: option.id,
                    text: option.text,
                    count,
                    percentage: answeredCount
                        ? Number(((count / answeredCount) * 100).toFixed(2))
                        : 0,
                };
            });

            return {
                id: question.id,
                text: question.text,
                isMandatory: question.isMandatory,
                totalAnswers: answeredCount,
                skipped: totalResponses - answeredCount,
                options,
            };
        }),
    };
};

const getPollForAnalytics = async (pollId) => {
    return prisma.poll.findUnique({
        where: { id: pollId },
        include: pollAnalyticsInclude,
    });
};

export const submitResponse = async (pollSlug, answers, respondentId = null) => {
    try {
        const poll = await prisma.poll.findUnique({
            where: { slug: pollSlug },
            include: {
                questions: {
                    include: { options: true },
                },
            },
        });

        if (!poll) {
            throw new Error("Poll not found");
        }

        if (poll.isPublished) {
            throw new Error("Poll results are already published");
        }

        if (isPollExpired(poll)) {
            throw new Error("Poll has expired");
        }

        if (!poll.isAnonymous && !respondentId) {
            throw new Error("Login is required to submit this poll");
        }

        const storedRespondentId = poll.isAnonymous ? null : respondentId;
        const answerList = Array.isArray(answers) ? answers : [];
        const answeredQuestionIds = answerList.map((answer) => answer.questionId);
        const uniqueAnsweredQuestionIds = new Set(answeredQuestionIds);

        if (uniqueAnsweredQuestionIds.size !== answeredQuestionIds.length) {
            throw new Error("Each question can only be answered once");
        }

        for (const question of poll.questions) {
            if (question.isMandatory && !uniqueAnsweredQuestionIds.has(question.id)) {
                throw new Error(`Mandatory question "${question.text}" must be answered`);
            }
        }

        for (const answer of answerList) {
            const question = poll.questions.find((item) => item.id === answer.questionId);
            if (!question) {
                throw new Error(`Question ${answer.questionId} not found`);
            }

            const option = question.options.find((item) => item.id === answer.selectedOptionId);
            if (!option) {
                throw new Error(`Invalid option for question ${answer.questionId}`);
            }
        }

        if (storedRespondentId) {
            const existingResponse = await prisma.response.findFirst({
                where: {
                    pollId: poll.id,
                    respondentId: storedRespondentId,
                },
            });

            if (existingResponse) {
                throw new Error("You have already submitted a response for this poll");
            }
        }

        return prisma.response.create({
            data: {
                pollId: poll.id,
                respondentId: storedRespondentId,
                questionResponses: {
                    create: answerList.map((answer) => ({
                        questionId: answer.questionId,
                        selectedOptionId: answer.selectedOptionId,
                    })),
                },
            },
            include: {
                questionResponses: {
                    include: {
                        question: true,
                        selectedOption: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error submitting response:", error);
        throw error;
    }
};

export const getPollAnalytics = async (pollId, userId) => {
    try {
        const poll = await getPollForAnalytics(pollId);

        if (!poll || poll.createdBy !== userId) {
            throw new Error("Unauthorized - Not poll creator");
        }

        return buildAnalytics(poll);
    } catch (error) {
        console.error("Error getting poll analytics:", error);
        throw error;
    }
};

export const getPublicPollAnalytics = async (pollId) => {
    try {
        const poll = await getPollForAnalytics(pollId);

        if (!poll) {
            throw new Error("Poll not found");
        }

        return buildAnalytics(poll);
    } catch (error) {
        console.error("Error getting public poll analytics:", error);
        throw error;
    }
};

export const getPollResponses = async (pollId, userId) => {
    try {
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || poll.createdBy !== userId) {
            throw new Error("Unauthorized - Not poll creator");
        }

        const responses = await prisma.response.findMany({
            where: { pollId },
            include: {
                questionResponses: {
                    include: {
                        question: true,
                        selectedOption: true,
                    },
                },
                respondent: poll.isAnonymous
                    ? false
                    : {
                        select: { id: true, name: true, email: true },
                    },
            },
            orderBy: { createdAt: "desc" },
        });

        return responses;
    } catch (error) {
        console.error("Error getting poll responses:", error);
        throw error;
    }
};
