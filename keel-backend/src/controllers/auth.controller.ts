import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

class AuthController {
  // 1) Register first ADMIN user
  static async registerAdmin(req: Request, res: Response) {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password || !full_name) {
        return res
          .status(400)
          .json({ message: "email, password and full_name are required" });
      }

      // Check if an admin already exists
      const adminRole = await Role.findOne({ where: { role_name: "ADMIN" } });
      if (!adminRole) {
        return res.status(500).json({ message: "ADMIN role not found" });
      }

      const existingAdmin = await User.findOne({
        where: { role_id: adminRole.get("id") },
      });

      if (existingAdmin) {
        return res
          .status(400)
          .json({ message: "An ADMIN already exists. Use login instead." });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password_hash: hash,
        full_name,
        role_id: adminRole.get("id"),
      });

      return res.status(201).json({
        message: "Admin user created successfully",
        user: {
          id: user.get("id"),
          email: user.get("email"),
          full_name: user.get("full_name"),
        },
      });
    } catch (err) {
      console.error("registerAdmin error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 2) Login (all roles: CADET, CTO, MASTER, SHORE, ADMIN)
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "email and password required" });
      }

      const user = await User.findOne({ where: { email }, include: [{ model: Role, as: "role" }] });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(
        password,
        user.get("password_hash") as string
      );

      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const roleInstance = user.get("role") as any;
      const roleName = roleInstance?.role_name || "UNKNOWN";

      const accessToken = generateAccessToken({
        userId: user.get("id"),
        role: roleName,
      });

      const refreshToken = generateRefreshToken({
        userId: user.get("id"),
      });

      user.set("refresh_token", refreshToken);
      await user.save();

      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.get("id"),
          email: user.get("email"),
          full_name: user.get("full_name"),
          role: roleName,
        },
      });
    } catch (err) {
      console.error("login error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 3) Refresh access token
  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "refreshToken is required" });
      }

      let payload: any;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const user = await User.findByPk(payload.userId, {
        include: [{ model: Role, as: "role" }],
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.get("refresh_token") !== refreshToken) {
        return res
          .status(401)
          .json({ message: "Refresh token does not match stored token" });
      }

      const roleInstance = user.get("role") as any;
      const roleName = roleInstance?.role_name || "UNKNOWN";

      const newAccessToken = generateAccessToken({
        userId: user.get("id"),
        role: roleName,
      });

      return res.json({ accessToken: newAccessToken });
    } catch (err) {
      console.error("refresh error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default AuthController;
