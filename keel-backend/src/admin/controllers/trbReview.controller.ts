// keel-backend/src/admin/controllers/trbReview.controller.ts
//
// KEEL — TRB Review & Sign-off Controllers
// ----------------------------------------
// PURPOSE:
// - Expose controlled review actions for CTO and Master
// - Enforce role authority at controller level
// - Delegate all workflow rules to workflow service
//
// IMPORTANT:
// - No SQL here
// - No direct DB updates here
// - All validation lives in workflow service
//

import type { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";

import {
  applyTrbReviewAction,
  TrbStatus,
  ReviewerRole,
} from "../services/trbReviewWorkflow.service.js";

/* -------------------------------------------------------------------------- */
/* POST — CTO Review Action                                                    */
/* -------------------------------------------------------------------------- */
/**
 * CTO can:
 * - Approve → CTO_APPROVED
 * - Reject → REJECTED
 */
export async function ctoReviewTrbTask(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const user = req.user;

  // Hard role enforcement
  if (!user || user.role !== "CTO") {
    return res.status(403).json({
      success: false,
      message: "Access denied. CTO role required.",
    });
  }

  const { stateId, action, rejectionComment } = req.body;

  if (!stateId || !action) {
    return res.status(400).json({
      success: false,
      message: "stateId and action are required",
    });
  }

  const nextStatus: TrbStatus =
    action === "approve" ? "CTO_APPROVED" : "REJECTED";

  const result = await applyTrbReviewAction({
    stateId,
    reviewerRole: "CTO" as ReviewerRole,
    nextStatus,
    rejectionComment,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
}

/* -------------------------------------------------------------------------- */
/* POST — Master Review Action                                                 */
/* -------------------------------------------------------------------------- */
/**
 * Master can:
 * - Approve → MASTER_APPROVED
 * - Reject → REJECTED
 */
export async function masterReviewTrbTask(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const user = req.user;

  // Hard role enforcement
  if (!user || user.role !== "MASTER") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Master role required.",
    });
  }

  const { stateId, action, rejectionComment } = req.body;

  if (!stateId || !action) {
    return res.status(400).json({
      success: false,
      message: "stateId and action are required",
    });
  }

  const nextStatus: TrbStatus =
    action === "approve" ? "MASTER_APPROVED" : "REJECTED";

  const result = await applyTrbReviewAction({
    stateId,
    reviewerRole: "MASTER" as ReviewerRole,
    nextStatus,
    rejectionComment,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
}
