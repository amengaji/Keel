// keel-backend/src/admin/controllers/adminShipTypes.controller.ts
//
// PURPOSE:
// - HTTP controller for Admin Ship Types (read-only)
// - Calls service layer
// - Returns audit-safe response
//

import { Request, Response } from "express";
import { fetchAdminShipTypes } from "../services/adminShipTypes.service.js";

export async function getAdminShipTypes(req: Request, res: Response) {
  try {
    const data = await fetchAdminShipTypes();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch ship types",
    });
  }
}
