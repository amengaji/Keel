// keel-backend/src/admin/routes/adminTrainees.routes.ts
//
// PURPOSE:
// - Route definitions for Admin Cadets & Trainees
// - Phase 2 safe (NO restore, NO hard delete)
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";

import {
  getAdminCadets,
  getAdminTrainees,
  createAdminTrainee,
  updateAdminTrainee,
  deleteAdminTrainee,
} from "../controllers/adminTrainees.controller.js";

const router = Router();

/* ======================================================================
 * CADET IDENTITY REGISTRY
 * ====================================================================== */

/**
 * GET /api/v1/admin/cadets
 */
router.get("/cadets", authGuard, getAdminCadets);

/**
 * POST /api/v1/admin/cadets
 */
router.post("/cadets", authGuard, createAdminTrainee);

/**
 * PUT /api/v1/admin/cadets/:cadetId
 */
router.put("/cadets/:cadetId", authGuard, updateAdminTrainee);

/**
 * DELETE /api/v1/admin/cadets/:cadetId
 * (Blocked in Phase 2 – audit safe)
 */
router.delete("/cadets/:cadetId", authGuard, deleteAdminTrainee);

/* ======================================================================
 * TRAINING / TRB VIEW (READ-ONLY)
 * ====================================================================== */

/**
 * GET /api/v1/admin/trainees
 */
router.get("/trainees", authGuard, getAdminTrainees);

export default router;
