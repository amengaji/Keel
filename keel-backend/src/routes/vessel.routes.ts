import { Router } from "express";
import VesselController from "../controllers/vessel.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Admin + Shore can create/delete
router.post(
  "/",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  VesselController.create
);

router.get("/", authGuard, VesselController.getAll);
router.get("/:id", authGuard, VesselController.getOne);

router.delete(
  "/:id",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  VesselController.delete
);

export default router;
