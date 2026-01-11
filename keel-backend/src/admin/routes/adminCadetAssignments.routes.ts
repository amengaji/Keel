// keel-backend/src/admin/routes/adminCadetAssignments.routes.ts
//
// PURPOSE:
// - Admin routes for Cadet → Vessel assignment
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  postAdminCadetAssignment,
  getAdminAssignmentHistory,
} from "../controllers/adminCadetAssignments.controller.js";

const router = Router();

/**
 * GET /api/v1/admin/cadet-assignments
 * Fetch history
 */
router.get(
  "/cadet-assignments",
  authGuard,
  getAdminAssignmentHistory
);

/**
 * POST /api/v1/admin/cadet-assignments
 * Create new assignment
 */
router.post(
  "/cadet-assignments",
  authGuard,
  postAdminCadetAssignment
);

export default router;