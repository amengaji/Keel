// keel-backend/src/admin/routes/adminVessels.routes.ts
//
// PURPOSE:
// - Route definitions for Admin Vessels
// - READ  : Audit-safe vessel register
// - WRITE : Create / Update / Soft Delete vessels
//
// BASE PATH:
// - Mounted under /api/v1/admin
//
// SECURITY:
// - All routes protected by cookie-first authGuard
// - Admin-only access enforced upstream
//

import { Router } from "express";
import {
  getAdminVessels,
  postAdminVessel,
  putAdminVessel,
  deleteAdminVessel,
  restoreVesselHandler,
} from "../controllers/adminVessels.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

/* ======================================================================
 * READ
 * ====================================================================== */

// GET /api/v1/admin/vessels
// Returns audit-safe vessel list (VIEW-based)
router.get("/vessels", authGuard, getAdminVessels);

/* ======================================================================
 * WRITE
 * ====================================================================== */

// POST /api/v1/admin/vessels
// Create a new vessel
router.post("/vessels", authGuard, postAdminVessel);

// PUT /api/v1/admin/vessels/:vesselId
// Update an existing vessel (IMO locked)
router.put("/vessels/:vesselId", authGuard, putAdminVessel);

// DELETE /api/v1/admin/vessels/:vesselId
// Soft delete a vessel (sets is_active = false)
router.delete("/vessels/:vesselId", authGuard, deleteAdminVessel);


//RESTORE 
router.patch("/vessels/:vesselId/restore", authGuard, restoreVesselHandler);


export default router;
