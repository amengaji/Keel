import { Request, Response } from "express";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

class MeController {
  static async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: "role" }],
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({
        id: user.get("id"),
        email: user.get("email"),
        full_name: user.get("full_name"),
        role: (user.get("role") as any)?.role_name,
      });
    } catch (err) {
      console.error("getMe error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default MeController;
