// keel-backend/src/admin/controllers/adminCadetAssignments.controller.ts
//
// PURPOSE:
// - HTTP controller for admin cadet assignments
//

import { Request, Response } from "express";
import { assignCadetToVessel } from "../services/adminCadetAssignments.service.js";

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
