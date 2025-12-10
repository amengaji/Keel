//keel-backend/src/route/familiarisationReview.routes.ts
import express from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import {
  getCtoPendingTasks,
  getCtoHistory,
  getMasterPendingTasks,
  getMasterHistory,
} from "../controllers/familiarisationReview.controller.js";

const router = express.Router();

// CTO ROUTES
router.get("/cto/pending", authGuard, getCtoPendingTasks);
router.get("/cto/history", authGuard, getCtoHistory);

// MASTER ROUTES
router.get("/master/pending", authGuard, getMasterPendingTasks);
router.get("/master/history", authGuard, getMasterHistory);

export default router;
