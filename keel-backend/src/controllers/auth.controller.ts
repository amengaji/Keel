import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

class AuthController {
  // 1) Register first ADMIN user (locked via route env flag)
  static async registerAdmin(req: Request, res: Response) {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password || !full_name) {
        return res
          .status(400)
          .json({ message: "email, password and full_name are required" });
      }

      const adminRole = await Role.findOne({ where: { role_name: "ADMIN" } });
      if (!adminRole) {
        return res.status(500).json({ message: "ADMIN role not found" });
      }

      const adminRoleId = adminRole.get("id") as number;

      const existingAdmin = await User.findOne({
        where: { role_id: adminRoleId },
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

      const password_hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password_hash,
        full_name,
        role_id: adminRoleId,
      });

      return res.status(201).json({
        message: "Admin user created successfully",
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        },
      });
    } catch (err) {
      console.error("registerAdmin error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // -----------------------------------------------------------------------------
  // 2) Login (ALL roles) — COOKIE-BASED AUTH (FINAL)
  // -----------------------------------------------------------------------------
  static async login(req: Request, res: Response) {
    console.log("🔥 LOGIN CONTROLLER HIT 🔥");

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "email and password required" });
      }

      const user = await User.findOne({
        where: { email },
        include: [{ model: Role, as: "role" }],
      });

      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid email or password" });
      }

      const hash = user.get("password_hash") as string;
      const valid = await bcrypt.compare(password, hash);

      if (!valid) {
        return res
          .status(401)
          .json({ message: "Invalid email or password" });
      }

      const roleInstance = user.get("role") as any;
      const roleName = roleInstance?.role_name || "UNKNOWN";

      // -------------------------------------------------------------------------
      // Generate tokens
      // -------------------------------------------------------------------------
      const accessToken = generateAccessToken({
        userId: user.id,
        role: roleName,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
      });

      // Persist refresh token (for rotation & logout later)
      user.set("refresh_token", refreshToken);
      await user.save();

      // -------------------------------------------------------------------------
      // SET HTTP-ONLY COOKIES (CRITICAL FIX)
      // -------------------------------------------------------------------------
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // localhost ONLY
        maxAge: 150 * 60 * 1000, // 150 minutes
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // localhost ONLY
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // -------------------------------------------------------------------------
      // RESPONSE (NO TOKENS EXPOSED)
      // -------------------------------------------------------------------------
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
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
        return res
          .status(400)
          .json({ message: "refreshToken is required" });
      }

      let payload: any;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const user = await User.findByPk(payload.userId, {
        include: [{ model: Role, as: "role" }],
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.get("refresh_token") !== refreshToken) {
        return res.status(401).json({
          message: "Refresh token does not match stored token",
        });
      }

      const roleInstance = user.get("role") as any;
      const roleName = roleInstance?.role_name || "UNKNOWN";

      const newAccessToken = generateAccessToken({
        userId: user.id,
        role: roleName,
      });

      return res.json({ accessToken: newAccessToken });
    } catch (err) {
      console.error("refresh error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 4) Admin-only: create user
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const admin = req.user;

      if (!admin || admin.role !== "ADMIN") {
        return res
          .status(403)
          .json({ message: "Access denied. Admin only." });
      }

      const { full_name, email, password, role_id } = req.body;

      if (!full_name || !email || !password || !role_id) {
        return res.status(400).json({
          message: "full_name, email, password, role_id required",
        });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Email already in use" });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        full_name,
        email,
        password_hash,
        role_id,
      });

      return res.json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role_id: newUser.role_id,
        },
      });
    } catch (err) {
      console.error("Create User Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

export default AuthController;
