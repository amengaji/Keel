// keel-backend/src/admin/routes/adminTrb.routes.ts
//
// KEEL — Admin TRB & Familiarisation Routes (READ-ONLY)
// -----------------------------------------------------
// PURPOSE:
// - Expose read-only TRB data for Shore Admin UI
// - All routes are protected
//
// BASE PATH (registered later):
//   /api/v1/admin/trb
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";

import {
  getAdminTrbCadets,
  getAdminTrbSections,
  getAdminTrbEvidence,
} from "../controllers/adminTrb.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/* GET — Cadet TRB Overview                                                    */
/* -------------------------------------------------------------------------- */
router.get("/cadets", authGuard, getAdminTrbCadets);

/* -------------------------------------------------------------------------- */
/* GET — Section Progress                                                      */
/* -------------------------------------------------------------------------- */
router.get("/sections", authGuard, getAdminTrbSections);

/* -------------------------------------------------------------------------- */
/* GET — Task Evidence / Attachments                                           */
/* -------------------------------------------------------------------------- */
router.get("/evidence", authGuard, getAdminTrbEvidence);

export default router;
