import { Router } from "express";
import {
  createAssessmentSession,
  getAssessmentDefinition,
  getAssessmentSession,
  submitAssessment,
  trackUserEvent
} from "../controllers/assessmentController.js";
import { requireAuth } from "../middleware/auth.js";

export const assessmentRouter = Router();

assessmentRouter.get("/definition", getAssessmentDefinition);
assessmentRouter.post("/sessions", requireAuth, createAssessmentSession);
assessmentRouter.get("/sessions/:id", requireAuth, getAssessmentSession);
assessmentRouter.post("/sessions/:id/events", requireAuth, trackUserEvent);
assessmentRouter.post("/sessions/:id/submit", requireAuth, submitAssessment);
