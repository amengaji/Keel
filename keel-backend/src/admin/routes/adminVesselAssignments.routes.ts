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

/* ====================================================================== */
/* READ — ASSIGNMENT HISTORY                                               */
/* ====================================================================== */

/**
 * GET /api/v1/admin/vessel-assignments
 *
 * Optional query params:
 * - cadet_id
 * - vessel_id
 */
router.get(
  "/vessel-assignments",
  authGuard,
  getVesselAssignments
);

export default router;
