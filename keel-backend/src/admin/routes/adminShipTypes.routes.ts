// keel-backend/src/admin/routes/adminShipTypes.routes.ts
import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  getAdminShipTypes,
  createShipTypeController,
  updateShipTypeController,
  deleteShipTypeController,
} from "../controllers/adminShipTypes.controller.js";

const router = Router();

// Base path in index.ts is /api/v1/admin

// GET /api/v1/admin/ship-types
router.get("/ship-types", authGuard, getAdminShipTypes);

// POST /api/v1/admin/ship-types
router.post("/ship-types", authGuard, createShipTypeController);

// PUT /api/v1/admin/ship-types/:id
router.put("/ship-types/:id", authGuard, updateShipTypeController);

// DELETE /api/v1/admin/ship-types/:id
router.delete("/ship-types/:id", authGuard, deleteShipTypeController);

export default router;
