import { Router } from "express";
import ShipTypeController from "../controllers/shipType.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Only ADMIN and SHORE can manage ship types
router.post("/", authGuard, requireRole(["ADMIN", "SHORE"]), ShipTypeController.create);
router.get("/", authGuard, ShipTypeController.getAll);
router.delete("/:id", authGuard, requireRole(["ADMIN", "SHORE"]), ShipTypeController.delete);

export default router;
