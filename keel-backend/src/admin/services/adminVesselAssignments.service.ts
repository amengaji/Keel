// keel-backend/src/admin/services/adminVesselAssignments.service.ts
//
// PURPOSE:
// - Phase 4B (READ)
// - Fetch cadet ↔ vessel assignment history
// - Timeline-safe and audit-safe
//
// DESIGN PRINCIPLES:
// - READ-ONLY (no mutation)
// - Uses assignment table as source of truth
// - Supports vessel drill-down + cadet drill-down
// - Safe for audit replay
//
// IMPORTANT:
// - No business rules enforced here
// - Reassignment rules handled elsewhere (Phase 4A-4)

import sequelize from "../../config/database.js";

/* ======================================================================
 * TYPES (INTERNAL)
 * ====================================================================== */

export interface VesselAssignmentRow {
  assignment_id: number;
  cadet_id: number;
  cadet_name: string;
  cadet_email: string;
  vessel_id: number;
  vessel_name: string;
  start_date: string;
  end_date: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

/* ======================================================================
 * READ — ASSIGNMENT HISTORY (BY VESSEL)
 * ====================================================================== */

/**
 * Fetch assignment timeline for a vessel
 *
 * USED BY:
 * - AdminVesselDetailPage (Phase 4B UI)
 *
 * RETURNS:
 * - Ordered timeline (latest first)
 */
export async function fetchAssignmentsByVessel(
  vesselId: number
): Promise<VesselAssignmentRow[]> {
  const [rows] = await sequelize.query(
    `
    SELECT
      a.id                AS assignment_id,
      a.cadet_id          AS cadet_id,
      u.full_name         AS cadet_name,
      u.email             AS cadet_email,
      a.vessel_id         AS vessel_id,
      v.name              AS vessel_name,
      a.start_date        AS start_date,
      a.end_date          AS end_date,
      a.status            AS status,
      a."createdAt"       AS created_at
    FROM cadet_vessel_assignments a
    JOIN users u   ON u.id = a.cadet_id
    JOIN vessels v ON v.id = a.vessel_id
    WHERE a.vessel_id = :vesselId
    ORDER BY a.start_date DESC, a.id DESC
    `,
    {
      replacements: { vesselId },
    }
  );

  return rows as VesselAssignmentRow[];
}

/* ======================================================================
 * READ — ASSIGNMENT HISTORY (BY CADET)
 * ====================================================================== */

/**
 * Fetch assignment timeline for a cadet
 *
 * USED BY:
 * - Cadet detail / profile pages (later Phase)
 *
 * RETURNS:
 * - Ordered timeline (latest first)
 */
export async function fetchAssignmentsByCadet(
  cadetId: number
): Promise<VesselAssignmentRow[]> {
  const [rows] = await sequelize.query(
    `
    SELECT
      a.id                AS assignment_id,
      a.cadet_id          AS cadet_id,
      u.full_name         AS cadet_name,
      u.email             AS cadet_email,
      a.vessel_id         AS vessel_id,
      v.name              AS vessel_name,
      a.start_date        AS start_date,
      a.end_date          AS end_date,
      a.status            AS status,
      a."createdAt"       AS created_at
    FROM cadet_vessel_assignments a
    JOIN users u   ON u.id = a.cadet_id
    JOIN vessels v ON v.id = a.vessel_id
    WHERE a.cadet_id = :cadetId
    ORDER BY a.start_date DESC, a.id DESC
    `,
    {
      replacements: { cadetId },
    }
  );

  return rows as VesselAssignmentRow[];
}
