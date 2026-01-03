// keel-backend/src/admin/routes/adminShipTypes.routes.ts
//
// PURPOSE:
// - Route definition for Admin Ship Types
// - Protected by authGuard
// - Read-only endpoint
//

import { Router } from "express";
import { getAdminShipTypes } from "../controllers/adminShipTypes.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

// GET /api/v1/admin/ship-types
router.get("/ship-types", authGuard, getAdminShipTypes);

export default router;
