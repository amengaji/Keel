// keel-backend/src/admin/services/adminVesselAssignmentClose.service.ts
//
// PURPOSE:
// - Phase 4E
// - Close an ACTIVE cadet-vessel assignment safely
//
// RULES:
// - Only ACTIVE assignments can be closed
// - end_date is mandatory
// - status transitions to COMPLETED
//
// AUDIT:
// - No deletes
// - Historical integrity preserved
//

import CadetVesselAssignment from "../../models/CadetVesselAssignment.js";

interface CloseAssignmentInput {
  assignmentId: number;
  end_date: string;
  notes?: string;
}

export async function closeAssignment(input: CloseAssignmentInput) {
  const { assignmentId, end_date, notes } = input;

  const assignment = await CadetVesselAssignment.findByPk(assignmentId);

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.getDataValue("status") !== "ACTIVE") {
    throw new Error("Only ACTIVE assignments can be closed");
  }

  await assignment.update({
    end_date,
    status: "COMPLETED",
    notes: notes ?? assignment.getDataValue("notes"),
  });

  return assignment;
}
