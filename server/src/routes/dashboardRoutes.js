import { Router } from "express";
import { getHistory, getOverview, getTrends } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get("/overview", getOverview);
dashboardRouter.get("/trends", getTrends);
dashboardRouter.get("/history", getHistory);
