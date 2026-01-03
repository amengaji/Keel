//keel-backend/src/admin/routes/adminUsersRoles.routes.ts
//
// PURPOSE:
// - Shore Admin Users & Roles routes
// - Read-only endpoints
//

import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  getAdminUsers,
  getAdminRoles
} from "../controllers/adminUsersRoles.controller.js";

const router = Router();

// GET: list all shore users
router.get("/users", authGuard, getAdminUsers);

// GET: list system roles
router.get("/roles", authGuard, getAdminRoles);

export default router;
