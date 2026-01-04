// keel-backend/src/admin/controllers/adminVessels.controller.ts
//
// PURPOSE:
// - HTTP controller for Admin Vessels
// - READ: List vessels (audit-safe) from admin_vessels_v via service
// - WRITE: Create / Update / Soft Delete vessels (table writes via service)
//
// RESPONSE STANDARD (Toast-friendly):
// - success: boolean
// - data: any (when relevant)
// - message: string (when relevant)
//
// NOTE:
// - We keep the GET list endpoint stable for UI wiring
// - IMO is immutable after creation (enforced in service layer)
// - Soft delete uses is_active flag (no physical deletes)
//

import { Request, Response } from "express";
import {
  fetchAdminVessels,
  createVessel,
  updateVessel,
  softDeleteVessel,
} from "../services/adminVessels.service.js";

/* ======================================================================
 * HELPERS
 * ====================================================================== */

/**
 * Convert thrown errors into toast-friendly HTTP responses.
 * We deliberately avoid returning raw DB errors to the UI.
 */
function respondWithError(res: Response, error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  // Map common business-rule errors to safe status codes
  // (This makes UI toast behavior consistent and predictable.)
  if (
    message.includes("required") ||
    message.includes("cannot be modified") ||
    message.includes("must")
  ) {
    return res.status(400).json({ success: false, message });
  }

  if (message.includes("not found")) {
    return res.status(404).json({ success: false, message });
  }

  if (message.includes("already exists") || message.includes("unique")) {
    return res.status(409).json({ success: false, message });
  }

  // Default fallback (server-side issue)
  return res.status(500).json({
    success: false,
    message,
  });
}

/* ======================================================================
 * READ (GET)
 * ====================================================================== */

/**
 * GET /api/v1/admin/vessels
 * - Returns audit-safe vessel register (view-based)
 * - Stable output for UI wiring
 */
export async function getAdminVessels(req: Request, res: Response) {
  try {
    const data = await fetchAdminVessels();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    // Keep original toast-friendly message behavior stable
    return res.status(500).json({
      success: false,
      message: "Unable to fetch vessels",
    });
  }
}

/* ======================================================================
 * WRITE (POST / PUT / DELETE)
 * ====================================================================== */

/**
 * POST /api/v1/admin/vessels
 * Create a vessel.
 *
 * Required:
 * - name
 * - imo_number (unique)
 * - ship_type_id
 */
export async function postAdminVessel(req: Request, res: Response) {
  try {
    const vessel = await createVessel(req.body);

    return res.status(201).json({
      success: true,
      data: vessel,
      message: "Vessel created successfully",
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

/**
 * PUT /api/v1/admin/vessels/:vesselId
 * Update a vessel.
 *
 * Rules:
 * - IMO cannot be changed after creation
 */
export async function putAdminVessel(req: Request, res: Response) {
  try {
    const vesselId = Number(req.params.vesselId);

    if (!Number.isFinite(vesselId) || vesselId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vessel id",
      });
    }

    const vessel = await updateVessel(vesselId, req.body);

    return res.json({
      success: true,
      data: vessel,
      message: "Vessel updated successfully",
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

/**
 * DELETE /api/v1/admin/vessels/:vesselId
 * Soft delete a vessel (audit safe).
 *
 * Action:
 * - sets is_active = false
 */
export async function deleteAdminVessel(req: Request, res: Response) {
  try {
    const vesselId = Number(req.params.vesselId);

    if (!Number.isFinite(vesselId) || vesselId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vessel id",
      });
    }

    const result = await softDeleteVessel(vesselId);

    return res.json({
      success: true,
      data: result,
      message: "Vessel deleted successfully",
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}
