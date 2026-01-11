import { Request, Response } from "express";
import { fetchDashboardStats } from "../services/adminDashboard.service.js";

function getRoleNameFromRequest(req: Request): string | null {
  const u = (req as any)?.user;
  if (!u) return null;
  return u.role?.role_name || u.roleName || null;
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Security Check
    const role = getRoleNameFromRequest(req);
    if (role !== "ADMIN" && role !== "SHORE") {
      return res.status(403).json({ success: false, message: "Unauthorized access to Command Center" });
    }

    const data = await fetchDashboardStats();
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("❌ Dashboard Stats Error:", err);
    return res.status(500).json({ success: false, message: "Unable to load dashboard stats" });
  }
}