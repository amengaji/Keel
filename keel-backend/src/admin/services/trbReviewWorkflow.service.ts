// keel-backend/src/admin/services/trbReviewWorkflow.service.ts
//
// KEEL — TRB Review & Sign-off Workflow Engine
// --------------------------------------------
// PURPOSE:
// - Enforce legal TRB status transitions
// - Enforce maritime authority (CTO / Master)
// - Apply audit timestamps and rejection reasons
// - Prevent modification after final approval
//
// IMPORTANT:
// - This file is the SINGLE source of truth for TRB workflow
// - Controllers MUST call this service
// - No direct DB writes outside this service
//

import sequelize from "../../config/database.js";
import { QueryTypes } from "sequelize";

/* -------------------------------------------------------------------------- */
/* ENUM DEFINITIONS (MATCH DB EXACTLY)                                         */
/* -------------------------------------------------------------------------- */

export type TrbStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "CTO_APPROVED"
  | "MASTER_APPROVED"
  | "REJECTED";

/* -------------------------------------------------------------------------- */
/* ROLE DEFINITIONS                                                            */
/* -------------------------------------------------------------------------- */

export type ReviewerRole = "CTO" | "MASTER";

/* -------------------------------------------------------------------------- */
/* ALLOWED STATUS TRANSITIONS (STEP A1)                                        */
/* -------------------------------------------------------------------------- */

const ALLOWED_TRANSITIONS: Record<
  TrbStatus,
  Partial<Record<ReviewerRole, TrbStatus[]>>
> = {
  NOT_STARTED: {},
  IN_PROGRESS: {},
  SUBMITTED: {
    CTO: ["CTO_APPROVED", "REJECTED"],
  },
  CTO_APPROVED: {
    MASTER: ["MASTER_APPROVED", "REJECTED"],
  },
  MASTER_APPROVED: {},
  REJECTED: {},
};

/* -------------------------------------------------------------------------- */
/* WORKFLOW ENGINE                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Apply a TRB review action (approve / reject).
 *
 * @param stateId - cadet_familiarisation_state.id
 * @param reviewerRole - "CTO" or "MASTER"
 * @param nextStatus - target status
 * @param rejectionComment - required if rejecting
 */
export async function applyTrbReviewAction(params: {
  stateId: number;
  reviewerRole: ReviewerRole;
  nextStatus: TrbStatus;
  rejectionComment?: string;
}) {
  const { stateId, reviewerRole, nextStatus, rejectionComment } = params;

  /* ------------------------------------------------------------------------ */
  /* STEP 1 — Load current state                                               */
  /* ------------------------------------------------------------------------ */
  const rows: any[] = await sequelize.query(
    `
    SELECT id, status
    FROM cadet_familiarisation_state
    WHERE id = :stateId
    `,
    {
      replacements: { stateId },
      type: QueryTypes.SELECT,
    }
  );

  const currentState = rows?.[0];

  if (!currentState) {
    return {
      success: false,
      message: "TRB task state not found",
    };
  }

  const currentStatus = currentState.status as TrbStatus;

  /* ------------------------------------------------------------------------ */
  /* STEP 2 — Hard lock after Master approval                                  */
  /* ------------------------------------------------------------------------ */
  if (currentStatus === "MASTER_APPROVED") {
    return {
      success: false,
      message: "Task already master-approved and locked",
    };
  }

  /* ------------------------------------------------------------------------ */
  /* STEP 3 — Validate transition                                              */
  /* ------------------------------------------------------------------------ */
  const allowedNext =
    ALLOWED_TRANSITIONS[currentStatus]?.[reviewerRole] ?? [];

  if (!allowedNext.includes(nextStatus)) {
    return {
      success: false,
      message: `Invalid transition from ${currentStatus} to ${nextStatus} by ${reviewerRole}`,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* STEP 4 — Rejection requires comment                                       */
  /* ------------------------------------------------------------------------ */
  if (nextStatus === "REJECTED" && !rejectionComment) {
    return {
      success: false,
      message: "Rejection comment is required",
    };
  }

  /* ------------------------------------------------------------------------ */
  /* STEP 5 — Build update payload                                             */
  /* ------------------------------------------------------------------------ */
  const updates: any = {
    status: nextStatus,
    updatedAt: new Date(),
  };

  if (nextStatus === "CTO_APPROVED") {
    updates.cto_signed_at = new Date();
  }

  if (nextStatus === "MASTER_APPROVED") {
    updates.master_signed_at = new Date();
  }

  if (nextStatus === "REJECTED") {
    updates.rejection_comment = rejectionComment;
  }

  /* ------------------------------------------------------------------------ */
  /* STEP 6 — Persist changes                                                  */
  /* ------------------------------------------------------------------------ */
  await sequelize.query(
    `
    UPDATE cadet_familiarisation_state
    SET
      status = :status,
      cto_signed_at = COALESCE(:cto_signed_at, cto_signed_at),
      master_signed_at = COALESCE(:master_signed_at, master_signed_at),
      rejection_comment = :rejection_comment,
      "updatedAt" = :updatedAt
    WHERE id = :stateId
    `,
    {
      replacements: {
        stateId,
        status: updates.status,
        cto_signed_at: updates.cto_signed_at ?? null,
        master_signed_at: updates.master_signed_at ?? null,
        rejection_comment: updates.rejection_comment ?? null,
        updatedAt: updates.updatedAt,
      },
    }
  );

  return {
    success: true,
    message: `TRB task moved to ${nextStatus}`,
  };
}
