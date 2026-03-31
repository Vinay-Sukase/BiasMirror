import { Router } from "express";
import {
  deleteSession,
  deleteUser,
  exportResearchAnalytics,
  getAdminOverview,
  listSessions,
  listUsers
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/admin.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/research-export", exportResearchAnalytics);
adminRouter.get("/users", listUsers);
adminRouter.get("/sessions", listSessions);
adminRouter.delete("/users/:id", deleteUser);
adminRouter.delete("/sessions/:id", deleteSession);
