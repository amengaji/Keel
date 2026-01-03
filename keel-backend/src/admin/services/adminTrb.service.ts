// keel-backend/src/admin/services/adminTrb.service.ts
//
// KEEL — Admin TRB & Familiarisation (READ-ONLY)
// ----------------------------------------------------
// PURPOSE:
// - Centralised data access for Shore Admin TRB screens
// - Reads ONLY from admin_* database views
// - No writes, no updates, no side effects
//
// IMPORTANT:
// - Uses raw SQL for audit safety
// - Any data transformation must remain minimal
// - This layer must NEVER mutate data
//

import sequelize from "../../config/database.js";

/* -------------------------------------------------------------------------- */
/* ADMIN TRB — CADET OVERVIEW                                                  */
/* -------------------------------------------------------------------------- */
/**
 * Fetch high-level TRB status per cadet per vessel.
 *
 * Source:
 *   admin_trb_cadets_v
 *
 * Used by:
 *   Shore Admin → TRB → Cadet Overview table
 */
export async function fetchAdminTrbCadets() {
  try {
    const [rows] = await sequelize.query(`
      SELECT *
      FROM admin_trb_cadets_v
      ORDER BY cadet_email ASC
    `);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("❌ Failed to fetch admin TRB cadets:", error);

    return {
      success: false,
      message: "Unable to fetch TRB cadet overview",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* ADMIN TRB — SECTION PROGRESS                                                */
/* -------------------------------------------------------------------------- */
/**
 * Fetch section-level progress for a cadet.
 *
 * Source:
 *   admin_trb_section_progress_v
 *
 * Notes:
 * - Section names are NOT resolved here (templates not in DB yet)
 * - section_id is intentionally returned for UI mapping later
 */
export async function fetchAdminTrbSections() {
  try {
    const [rows] = await sequelize.query(`
      SELECT *
      FROM admin_trb_section_progress_v
      ORDER BY cadet_email ASC, section_id ASC
    `);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("❌ Failed to fetch admin TRB section progress:", error);

    return {
      success: false,
      message: "Unable to fetch TRB section progress",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* ADMIN TRB — TASK EVIDENCE                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Fetch all familiarisation task evidence (attachments).
 *
 * Source:
 *   admin_trb_task_evidence_v
 *
 * IMPORTANT:
 * - file_url is returned as-is (S3 signed URL handling happens elsewhere)
 * - This is metadata only — no file access here
 */
export async function fetchAdminTrbEvidence() {
  try {
    const [rows] = await sequelize.query(`
      SELECT *
      FROM admin_trb_task_evidence_v
      ORDER BY uploaded_at DESC
    `);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("❌ Failed to fetch admin TRB evidence:", error);

    return {
      success: false,
      message: "Unable to fetch TRB task evidence",
    };
  }
}
