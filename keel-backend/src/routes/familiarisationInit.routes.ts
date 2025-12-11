import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import FamiliarisationInitController from "../controllers/familiarisationInit.controller.js";

const router = Router();

router.post("/familiarisation/init", authGuard, FamiliarisationInitController.initialize);

export default router;
