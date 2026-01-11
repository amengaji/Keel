// keel-backend/src/admin/controllers/adminCadetAssignments.controller.ts
//
// PURPOSE:
// - HTTP controller for admin cadet assignments
//

import { Request, Response } from "express";
import {
  assignCadetToVessel,
  fetchAssignmentHistory,
} from "../services/adminCadetAssignments.service.js";

/**
 * POST /api/v1/admin/cadet-assignments
 * Assign a cadet to a vessel
 */
export async function postAdminCadetAssignment(
  req: Request,
  res: Response
) {
  try {
    const { cadet_id, vessel_id } = req.body;

    if (!cadet_id || !vessel_id) {
      return res.status(400).json({
        success: false,
        message: "cadet_id and vessel_id are required",
      });
    }

    const result = await assignCadetToVessel(
      Number(cadet_id),
      Number(vessel_id)
    );

    res.status(201).json({
      success: true,
      message: "Cadet assigned to vessel successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Unable to assign cadet",
    });
  }
}

/**
 * GET /api/v1/admin/cadet-assignments
 * Fetch assignment history
 */
export async function getAdminAssignmentHistory(
  req: Request,
  res: Response
) {
  try {
    const data = await fetchAssignmentHistory();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch assignment history",
    });
  }
}