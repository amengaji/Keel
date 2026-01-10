// keel-backend/src/admin/routes/adminVesselAssignments.routes.ts
//
// PURPOSE:
// - Admin READ routes for vessel ↔ cadet assignment history
// - Phase 4B (Audit-safe timeline)
//
// BASE PATH:
// - Mounted under /api/v1/admin
//
// SECURITY:
// - authGuard enforced
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  getVesselAssignments,
} from "../controllers/adminVesselAssignments.controller.js";

const router = Router();

/**
 * Existing (keep)
 * GET /api/v1/admin/vessel-assignments
 */
router.get("/vessel-assignments", getVesselAssignments);

/**
 * ✅ NEW ALIAS (Phase 4B / 4C UI)
 * GET /api/v1/admin/vessels/:vesselId/assignments
 */
router.get(
  "/vessels/:vesselId/assignments",
  (req, res, next) => {
    // normalize param → query (NO logic duplication)
    req.query.vessel_id = req.params.vesselId;
    next();
  },
  getVesselAssignments
);


export default router;
