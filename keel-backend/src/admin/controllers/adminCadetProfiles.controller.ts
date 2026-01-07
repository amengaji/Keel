// keel-backend/src/admin/controllers/adminCadetProfiles.controller.ts
//
// PURPOSE:
// - HTTP controller for Cadet Profile (identity only)
//
// NOTES:
// - Service may throw HttpError(statusCode, message) for safe UI toasts.
// - We map that to correct HTTP status (409 for uniqueness conflicts, etc.).
//

import { Request, Response } from "express";
import {
  getCadetProfile,
  upsertCadetProfile,
} from "../services/adminCadetProfiles.service.js";

/**
 * GET /api/v1/admin/cadets/:cadetId/profile
 * - Prefill endpoint for Shore Admin profile form.
 * - Returns:
 *   { success: true, data: <profile|null> }
 */
export async function getAdminCadetProfile(req: Request, res: Response) {
  try {
    const cadetId = Number(req.params.cadetId);

    if (!cadetId || Number.isNaN(cadetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cadet ID",
      });
    }

    const data = await getCadetProfile(cadetId);

    return res.json({
      success: true,
      data, // profile object OR null
    });
  } catch (error: any) {
    const statusCode =
      typeof error?.statusCode === "number" ? error.statusCode : 400;

    console.error(error);

    return res.status(statusCode).json({
      success: false,
      message: error?.message || "Unable to load cadet profile",
    });
  }
}

/**
 * POST /api/v1/admin/cadets/:cadetId/profile
 */
export async function upsertAdminCadetProfile(req: Request, res: Response) {
  try {
    const cadetId = Number(req.params.cadetId);

    if (!cadetId || Number.isNaN(cadetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cadet ID",
      });
    }

    const result = await upsertCadetProfile(cadetId, req.body);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    // If service provided a statusCode (e.g., 409), use it.
    const statusCode =
      typeof error?.statusCode === "number" ? error.statusCode : 400;

    console.error(error);

    return res.status(statusCode).json({
      success: false,
      message: error?.message || "Unable to save cadet profile",
    });
  }
}
