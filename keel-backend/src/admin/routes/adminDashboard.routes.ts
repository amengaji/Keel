import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware.js";
import { getDashboardStats } from "../controllers/adminDashboard.controller.js";

const router = Router();

// GET /api/v1/admin/dashboard
router.get("/dashboard", authGuard, getDashboardStats);

export default router;