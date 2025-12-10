import express from "express";
import Role from "../models/Role.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/roles", authGuard, async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ["id", "role_name"]
    });

    res.json({
      success: true,
      roles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching roles" });
  }
});

export default router;
