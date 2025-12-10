//keel-backend/src/models/familiarisationProgress.routes.ts
import express from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import {
  getSectionProgress,
  getCadetOverallProgress,
} from "../controllers/familiarisationProgress.controller.js";

const router = express.Router();

// Section progress
router.get(
  "/progress/:cadetId/:vesselId/section/:sectionId",
  authGuard,
  getSectionProgress
);

// Overall progress
router.get(
  "/progress/:cadetId/:vesselId",
  authGuard,
  getCadetOverallProgress
);

export default router;
