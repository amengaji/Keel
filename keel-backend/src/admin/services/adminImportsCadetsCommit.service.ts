// keel-backend/src/admin/services/adminImportsCadetsCommit.service.ts
//
// PURPOSE:
// - Cadet Excel Import — COMMIT phase (STRICT writes)
// - Re-validate using the same preview rules
// - Hard-gate on failures (fail > 0) and empty-ready batches
// - Perform all DB writes inside a single transaction
//
// SAFETY:
// - No partial imports
// - Transaction rollback on any write failure
// - No writes to cadet_profiles, vessels, TRB progress
//
// IDEMPOTENCY POLICY (SAFE):
// - If email already exists at commit-time, treat as SKIP (not FAIL)
//   This prevents duplicate accounts and allows safe re-runs.
//

import sequelize from "../../config/database.js";
import User from "../../models/User.js";
import Role from "../../models/Role.js";
import { v4 as uuidv4 } from "uuid";
import {
  previewCadetImportXlsx,
  CadetImportPreviewRow,
  CadetImportPreviewRowStatus,
} from "./adminImports.service.js";

/* ======================================================================
 * TYPES
 * ====================================================================== */

export type CadetImportCommitRowOutcome = "CREATED" | "SKIPPED";

export type CadetImportCommitRowResult = {
  row_number: number;

  // The status from preview validation logic
  preview_status: CadetImportPreviewRowStatus;

  // The final commit outcome (created vs skipped)
  commit_outcome: CadetImportCommitRowOutcome;

  // Populated only when created
  created_user_id: number | null;

  // Convenience fields for UI/debug/audit
  email: string | null;
  full_name: string | null;

  // Notes/issues for this row (includes preview issues plus commit-time notes)
  issues: string[];
};

export type CadetImportCommitSummary = {
  total: number;
  created: number;
  skipped: number;
  fail: number; // will be 0 on success (because we hard-gate)
  ready: number; // created from READY
  ready_with_warnings: number; // created from READY_WITH_WARNINGS
};

export type CadetImportCommitResult = {
  import_batch_id: string;
  summary: CadetImportCommitSummary;
  results: CadetImportCommitRowResult[];
  notes: string[];
};

/* ======================================================================
 * SMALL HELPERS
 * ====================================================================== */

/**
 * Lowercase-email existence check using a raw query (consistent with preview).
 * We do this inside the transaction to avoid race conditions between preview & commit.
 */
async function findExistingEmailsLowerTx(
  emailsLower: string[],
  transaction: any
): Promise<Set<string>> {
  if (emailsLower.length === 0) return new Set<string>();

  const [rows] = await sequelize.query(
    `
      SELECT LOWER(email) AS email_lower
      FROM users
      WHERE LOWER(email) IN (:emailsLower)
    `,
    { replacements: { emailsLower }, transaction }
  );

  const set = new Set<string>();
  for (const r of rows as any[]) {
    if (r?.email_lower) set.add(String(r.email_lower));
  }
  return set;
}

/**
 * Create a user (identity only) within an existing transaction.
 * This mirrors your current createTrainee() behavior (users + CADET role, password_hash TEMP).
 */
async function createCadetUserTx(params: {
  email: string;
  full_name: string;
  transaction: any;
}): Promise<{ userId: number }> {
  const { email, full_name, transaction } = params;

  // Role must exist for safety
  const cadetRole = await Role.findOne({
    where: { role_name: "CADET" },
    transaction,
  });

  if (!cadetRole) {
    throw new Error("CADET role not found");
  }

  const created = await User.create(
    {
      email,
      full_name,
      password_hash: "TEMP", // placeholder (Phase 3 auth flow)
      role_id: (cadetRole as any).id,
    } as any,
    { transaction }
  );

  return { userId: (created as any).id };
}

/* ======================================================================
 * COMMIT — MAIN
 * ====================================================================== */

export async function commitCadetImportXlsx(
  buffer: Buffer
): Promise<CadetImportCommitResult> {
  const import_batch_id = uuidv4();
  const notes: string[] = [];

  // 1) Preview validation (strict headers + per-row rules)
  const preview = await previewCadetImportXlsx(buffer);

  // 2) Hard gates (based on preview rules)
  if (preview.summary.fail > 0) {
    const err: any = new Error("Commit blocked: some rows failed validation (fail > 0).");
    err.data = { import_batch_id, preview };
    throw err;
  }

  // NOTE (Policy B):
  // We do NOT block here if everything is SKIP.
  // This allows idempotent, retry-safe no-op commits.
  // We will decide no-op vs write AFTER commit-time checks.
                        
  // 3) Single transaction for the entire commit
  const transaction = await sequelize.transaction();

  try {
    // 4) Commit-time idempotency re-check (inside transaction)
    const candidateRows = preview.rows.filter(
      (r) => r.status === "READY" || r.status === "READY_WITH_WARNINGS"
    );

    const candidateEmailsLower = Array.from(
      new Set(
        candidateRows
          .map((r) => r.normalized.email?.toLowerCase() || "")
          .filter((x) => x.length > 0)
      )
    );

    const existingEmailSet = await findExistingEmailsLowerTx(
      candidateEmailsLower,
      transaction
    );

    // 5) Build a plan first (validate everything, then write)
    const plan: Array<{
      row: CadetImportPreviewRow;
      commit_outcome: CadetImportCommitRowOutcome;
      issues: string[];
      shouldCreate: boolean;
    }> = [];

    for (const row of preview.rows) {
      const baseIssues = Array.isArray(row.issues) ? [...row.issues] : [];
      const emailLower = row.normalized.email
        ? row.normalized.email.toLowerCase()
        : null;

      // FAIL should not exist here due to hard-gate; keep safe anyway
      if (row.status === "FAIL") {
        plan.push({
          row,
          commit_outcome: "SKIPPED",
          issues: [...baseIssues, "Commit skipped due to FAIL (should not happen after gating)"],
          shouldCreate: false,
        });
        continue;
      }

      // Preview SKIP stays SKIP
      if (row.status === "SKIP") {
        plan.push({
          row,
          commit_outcome: "SKIPPED",
          issues: baseIssues,
          shouldCreate: false,
        });
        continue;
      }

      // READY / READY_WITH_WARNINGS: re-check existence at commit-time
      if (emailLower && existingEmailSet.has(emailLower)) {
        plan.push({
          row,
          commit_outcome: "SKIPPED",
          issues: [...baseIssues, "email already exists at commit time (skipped)"],
          shouldCreate: false,
        });
        continue;
      }

      // This row is eligible for creation
      plan.push({
        row,
        commit_outcome: "CREATED",
        issues: baseIssues,
        shouldCreate: true,
      });
    }

    const plannedCreates = plan.filter((p) => p.shouldCreate).length;

  // 6) No-op commit handling (Policy B — idempotent success)
  //
  // If there are no rows to create (all SKIP), we DO NOT throw.
  // We return a successful, audit-safe no-op response.
  // This allows safe retries and avoids false failures.
  if (plannedCreates === 0) {
    await transaction.commit();

    const results: CadetImportCommitRowResult[] = preview.rows.map((row) => ({
      row_number: row.row_number,
      preview_status: row.status,
      commit_outcome: "SKIPPED",
      created_user_id: null,
      email: row.normalized.email ?? null,
      full_name: row.normalized.full_name ?? null,
      issues: Array.isArray(row.issues) ? row.issues : [],
    }));

    return {
      import_batch_id,
      summary: {
        total: results.length,
        created: 0,
        skipped: results.length,
        fail: 0,
        ready: 0,
        ready_with_warnings: 0,
      },
      results,
      notes: ["No new users created (all rows already exist)."],
    };
  }

    // 7) Execute writes (still within the same transaction)
    const results: CadetImportCommitRowResult[] = [];

    for (const p of plan) {
      const email = p.row.normalized.email ?? null;
      const full_name = p.row.normalized.full_name ?? null;

      if (!p.shouldCreate) {
        results.push({
          row_number: p.row.row_number,
          preview_status: p.row.status,
          commit_outcome: "SKIPPED",
          created_user_id: null,
          email,
          full_name,
          issues: p.issues,
        });
        continue;
      }

      // Guard clauses to prevent unexpected nulls
      if (!email || !full_name) {
        throw new Error(
          `Unexpected null email/full_name at row ${p.row.row_number} during commit.`
        );
      }

      const created = await createCadetUserTx({
        email,
        full_name,
        transaction,
      });

      results.push({
        row_number: p.row.row_number,
        preview_status: p.row.status,
        commit_outcome: "CREATED",
        created_user_id: created.userId,
        email,
        full_name,
        issues: p.issues,
      });
    }

    await transaction.commit();

    // 8) Build summary (commit-focused)
    const createdCount = results.filter((r) => r.commit_outcome === "CREATED").length;
    const skippedCount = results.filter((r) => r.commit_outcome === "SKIPPED").length;

    const createdFromReady = results.filter(
      (r) => r.commit_outcome === "CREATED" && r.preview_status === "READY"
    ).length;

    const createdFromWarnings = results.filter(
      (r) =>
        r.commit_outcome === "CREATED" &&
        r.preview_status === "READY_WITH_WARNINGS"
    ).length;

    if (createdFromWarnings > 0) {
      notes.push("Some created rows had warnings (override values differ from derived values).");
    }

    return {
      import_batch_id,
      summary: {
        total: results.length,
        created: createdCount,
        skipped: skippedCount,
        fail: 0,
        ready: createdFromReady,
        ready_with_warnings: createdFromWarnings,
      },
      results,
      notes,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
