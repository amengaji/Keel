// keel-backend/src/admin/controllers/adminVesselAssignmentClose.controller.ts
//
// PURPOSE:
// - Phase 4E
// - Close an ACTIVE cadet-vessel assignment
//
// RULES:
// - Assignment must exist
// - Status must be ACTIVE
// - end_date is mandatory
// - Status becomes COMPLETED
//
// AUDIT:
// - No deletes
// - Immutable history preserved
//

import { Request, Response } from "express";
import { closeAssignment } from "../services/adminVesselAssignmentClose.service.js";

export async function closeVesselAssignment(req: Request, res: Response) {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const { end_date, notes } = req.body;

    if (!assignmentId || Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment identifier",
      });
    }

    if (!end_date) {
      return res.status(400).json({
        success: false,
        message: "end_date is required to close assignment",
      });
    }

    const result = await closeAssignment({
      assignmentId,
      end_date,
      notes,
    });

    return res.json({
      success: true,
      message: "Assignment closed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Close assignment failed:", error);

    return res.status(400).json({
      success: false,
      message: error?.message || "Unable to close assignment",
    });
  }
}
