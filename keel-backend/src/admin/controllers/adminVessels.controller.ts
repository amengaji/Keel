// keel-backend/src/admin/controllers/adminVessels.controller.ts
//
// PURPOSE:
// - HTTP controller for Admin Vessels (read-only)
// - Returns audit-safe vessel register
//

import { Request, Response } from "express";
import { fetchAdminVessels } from "../services/adminVessels.service.js";

export async function getAdminVessels(req: Request, res: Response) {
  try {
    const data = await fetchAdminVessels();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch vessels",
    });
  }
}
