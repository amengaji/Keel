// keel-backend/src/admin/routes/adminVesselAssignmentClose.routes.ts
//
// PURPOSE:
// - Phase 4E
// - Close / complete an ACTIVE cadet-vessel assignment
//
// ENDPOINT:
// - POST /api/v1/admin/vessel-assignments/:assignmentId/close
//
// SAFETY:
// - Audit-safe
// - No deletes
// - No reassignment logic here
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import { closeVesselAssignment } from "../controllers/adminVesselAssignmentClose.controller.js";

const router = Router();

router.post(
  "/vessel-assignments/:assignmentId/close",
  authGuard,
  closeVesselAssignment
);

export default router;
