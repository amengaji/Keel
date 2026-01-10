// keel-backend/src/admin/controllers/adminVesselAssignments.controller.ts
//
// PURPOSE:
// - READ-ONLY vessel ↔ cadet assignment history
// - Phase 4B (Audit-safe timeline)
// - NO writes, NO updates, NO deletes
//
// ENDPOINT:
// - GET /api/v1/admin/vessel-assignments
//
// SECURITY:
// - Cookie-based auth (authGuard enforced at route level)
//
// AUDIT RULES:
// - Historical data is immutable
// - Active + completed assignments returned
//

import { Request, Response } from "express";
import sequelize from "../../config/database.js";

/* ====================================================================== */
/* READ — ASSIGNMENT HISTORY                                               */
/* ====================================================================== */

/**
 * GET /api/v1/admin/vessel-assignments
 *
 * Optional filters (query params):
 * - cadet_id
 * - vessel_id
 *
 * RETURNS:
 * - assignment_id
 * - cadet_id, cadet_name
 * - vessel_id, vessel_name
 * - start_date, end_date
 * - status
 */
export async function getVesselAssignments(
  req: Request,
  res: Response
) {
  try {
    const { cadet_id, vessel_id } = req.query;

    const replacements: any = {};

    let whereClause = "1 = 1";

    if (cadet_id) {
      whereClause += " AND a.cadet_id = :cadet_id";
      replacements.cadet_id = cadet_id;
    }

    if (vessel_id) {
      whereClause += " AND a.vessel_id = :vessel_id";
      replacements.vessel_id = vessel_id;
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        a.id                 AS assignment_id,
        a.cadet_id,
        u.full_name          AS cadet_name,
        a.vessel_id,
        v.name               AS vessel_name,
        a.start_date,
        a.end_date,
        a.status,
        a."createdAt"        AS created_at
      FROM cadet_vessel_assignments a
      JOIN users u   ON u.id = a.cadet_id
      JOIN vessels v ON v.id = a.vessel_id
      WHERE ${whereClause}
      ORDER BY a.start_date DESC
      `,
      { replacements }
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Failed to fetch vessel assignments:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vessel assignment history",
    });
  }
}
