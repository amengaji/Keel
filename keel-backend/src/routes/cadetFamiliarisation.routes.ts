import express from "express";
import { assignCadetToVessel } from "../controllers/cadetFamiliarisation.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin/Shore assigns cadet to vessel
router.post(
  "/cadets/:cadetId/assign-vessel",
  authGuard,
  assignCadetToVessel
);

export default router;
