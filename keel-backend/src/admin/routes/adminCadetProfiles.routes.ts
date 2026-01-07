// keel-backend/src/admin/routes/adminCadetProfiles.routes.ts
//
// PURPOSE:
// - Cadet Profile routes (identity only)
//
// PHASE:
// - Phase 3A (Identity enrichment)
//
// ROUTES:
// - GET  /api/v1/admin/cadets/:cadetId/profile  (prefill form; read-only)
// - POST /api/v1/admin/cadets/:cadetId/profile  (upsert; identity only)
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  getAdminCadetProfile,
  upsertAdminCadetProfile,
} from "../controllers/adminCadetProfiles.controller.js";

const router = Router();

/**
 * GET /api/v1/admin/cadets/:cadetId/profile
 * - Returns the cadet profile if present, otherwise null.
 * - Audit-safe read.
 */
router.get("/cadets/:cadetId/profile", authGuard, getAdminCadetProfile);

/**
 * POST /api/v1/admin/cadets/:cadetId/profile
 * - Creates or updates cadet profile (identity only).
 */
router.post("/cadets/:cadetId/profile", authGuard, upsertAdminCadetProfile);

export default router;
