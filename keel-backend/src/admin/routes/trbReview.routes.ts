// keel-backend/src/admin/routes/trbReview.routes.ts
//
// KEEL — TRB Review & Sign-off Routes
// -----------------------------------
// PURPOSE:
// - Expose controlled review actions for CTO and Master
// - All routes are protected by authGuard
//
// BASE PATH (registered later):
//   /api/v1/admin/trb/review
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";

import {
  ctoReviewTrbTask,
  masterReviewTrbTask,
} from "../controllers/trbReview.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/* POST — CTO Review                                                          */
/* -------------------------------------------------------------------------- */
router.post("/cto", authGuard, ctoReviewTrbTask);

/* -------------------------------------------------------------------------- */
/* POST — Master Review                                                       */
/* -------------------------------------------------------------------------- */
router.post("/master", authGuard, masterReviewTrbTask);

export default router;

