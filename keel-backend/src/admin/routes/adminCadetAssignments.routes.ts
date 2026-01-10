// keel-backend/src/admin/routes/adminCadetAssignments.routes.ts
//
// PURPOSE:
// - Admin routes for Cadet → Vessel assignment
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  postAdminCadetAssignment,
} from "../controllers/adminCadetAssignments.controller.js";

const router = Router();

/**
 * POST /api/v1/admin/cadet-assignments
 */
router.post(
  "/cadet-assignments",
  authGuard,
  postAdminCadetAssignment
);

export default router;
