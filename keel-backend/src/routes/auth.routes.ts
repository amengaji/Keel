import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = Router();

// First-time creation of ADMIN user
if (process.env.ALLOW_ADMIN_REGISTER === "true") {
  router.post("/register-admin", AuthController.registerAdmin);
}

// Login for all users (cadet, CTO, Master, Shore, Admin)
router.post("/login", AuthController.login);

// Refresh access token
router.post("/refresh", AuthController.refresh);

// Create ANY user (Admin only)
router.post("/create-user", authGuard, AuthController.createUser);

export default router;
