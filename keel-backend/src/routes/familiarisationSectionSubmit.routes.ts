import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import FamiliarisationSectionSubmitController from "../controllers/familiarisationSectionSubmit.controller.js";

const router = Router();

router.post(
  "/familiarisation/section/submit",
  authGuard,
  FamiliarisationSectionSubmitController.submitSection
);

export default router;
