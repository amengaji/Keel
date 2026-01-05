// keel-backend/src/admin/routes/adminTrainees.routes.ts
//
// PURPOSE:
// - Route definitions for Admin Trainees (READ-ONLY)
// - Protected by admin auth
//

import { Router } from "express";
import { getAdminTrainees } from "../controllers/adminTrainees.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/v1/admin/trainees
 */
router.get("/trainees", authGuard, getAdminTrainees);

export default router;
