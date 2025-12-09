import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

// First-time creation of ADMIN user
router.post("/register-admin", AuthController.registerAdmin);

// Login for all users (cadet, CTO, Master, Shore, Admin)
router.post("/login", AuthController.login);

// Refresh access token
router.post("/refresh", AuthController.refresh);

export default router;
