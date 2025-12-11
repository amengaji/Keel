import { Router } from "express";
import VesselAssignmentController from "../controllers/vesselAssignment.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = Router();

// Admin only — but we can enforce this later
router.put("/assign-cadet", authGuard, VesselAssignmentController.assignCadet);

export default router;
