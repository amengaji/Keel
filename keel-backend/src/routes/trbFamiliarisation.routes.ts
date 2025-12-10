import express from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import { getFamiliarisationSummary } from "../controllers/trbFamiliarisation.controller.js";

const router = express.Router();

// TRB familiarisation summary for one cadet on one vessel
router.get(
  "/trb/familiarisation/:cadetId/:vesselId",
  authGuard,
  getFamiliarisationSummary
);

export default router;
