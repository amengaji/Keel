import { Router } from "express";
import MeController from "../controllers/me.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard, MeController.getMe);

export default router;
