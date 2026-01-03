// keel-backend/src/admin/routes/adminVessels.routes.ts
//
// PURPOSE:
// - Route definition for Admin Vessels
// - Read-only, auth-protected
//

import { Router } from "express";
import { getAdminVessels } from "../controllers/adminVessels.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

// GET /api/v1/admin/vessels
router.get("/vessels", authGuard, getAdminVessels);

export default router;
