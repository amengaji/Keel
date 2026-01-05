// keel-backend/src/admin/controllers/adminTrainees.controller.ts
//
// PURPOSE:
// - HTTP controller for Admin Trainees (READ-ONLY)
// - Source: admin_trb_cadets_v (audit-safe DB VIEW)
//
// GUARANTEES:
// - No writes
// - Toast-friendly error messages
//

import { Request, Response } from "express";
import { fetchAdminTrainees } from "../services/adminTrainees.service.js";

/**
 * GET /api/v1/admin/trainees
 *
 * Returns:
 * - List of cadets with vessel assignment & TRB progress
 */
export async function getAdminTrainees(req: Request, res: Response) {
  try {
    const data = await fetchAdminTrainees();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ Unable to fetch trainees:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch trainees",
    });
  }
}
