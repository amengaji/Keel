// keel-backend/src/middleware/auth.middleware.ts
//
// KEEL — Authentication Guard (COOKIE-FIRST)
// -------------------------------------------
// PURPOSE:
// - Protect routes using HttpOnly cookies
// - Supports Authorization header as fallback
// - Central enforcement of role-based access
//
// IMPORTANT:
// - Access token is NEVER read from frontend JS
// - Cookie is the primary source of truth
//

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export interface AuthUser {
  userId: number;
  role: string; // ADMIN | CTO | MASTER | CADET | SHORE
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/* -------------------------------------------------------------------------- */
/* Auth Guard                                                                 */
/* -------------------------------------------------------------------------- */
export function authGuard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // -----------------------------------------------------------------------
    // 1️⃣ Read token from HttpOnly cookie (PRIMARY)
    // -----------------------------------------------------------------------
    const cookieToken = req.cookies?.access_token;

    // -----------------------------------------------------------------------
    // 2️⃣ Fallback: Authorization header (OPTIONAL / future API use)
    // -----------------------------------------------------------------------
    const headerToken =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        message: "Access token missing",
      });
    }

    // -----------------------------------------------------------------------
    // 3️⃣ Verify token
    // -----------------------------------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as AuthUser;

    // -----------------------------------------------------------------------
    // 4️⃣ Attach user to request
    // -----------------------------------------------------------------------
    req.user = decoded;

    next();
  } catch (err) {
    console.error("AuthGuard error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
