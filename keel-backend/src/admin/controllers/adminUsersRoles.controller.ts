//keel-backend/src/admin/controllers/adminUsersRoles.controller.ts
//
// PURPOSE:
// - HTTP controllers for Shore Admin Users & Roles
// - Strictly read-only
//
// SECURITY:
// - Requires authenticated user (JWT)
// - Company scoped
//

import { Request, Response } from "express";
import {
  fetchAdminUsers,
  fetchAdminRoles
} from "../services/adminUsersRoles.service.js";

/**
 * GET /api/v1/admin/users
 * Returns all shore users for the current company
 */
export async function getAdminUsers(req: Request, res: Response) {
  try {
    // Company ID is injected by auth middleware
    const companyId = (req as any).user.company_id;

    const users = await fetchAdminUsers(companyId);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("❌ Failed to fetch admin users:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users"
    });
  }
}

/**
 * GET /api/v1/admin/roles
 * Returns system-defined roles
 */
export async function getAdminRoles(req: Request, res: Response) {
  try {
    const roles = await fetchAdminRoles();

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error("❌ Failed to fetch admin roles:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch roles"
    });
  }
}
