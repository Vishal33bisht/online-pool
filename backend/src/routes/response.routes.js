import express from "express";
import validate from "../middlewares/validate.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import { submitResponseSchema } from "../validators/response.validator.js";
import * as responseController from "../controllers/response.controller.js";

const router = express.Router();

// Public routes - token is optional unless the poll requires authenticated responses
router.post("/:slug/submit", optionalAuthMiddleware, validate(submitResponseSchema), responseController.submitResponse);
router.get("/:slug/results", responseController.getPublicResults);

export default router;
