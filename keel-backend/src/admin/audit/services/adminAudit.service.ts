// keel-backend/src/admin/audit/services/adminAudit.service.ts
//
// KEEL — Admin Audit Export Service (READ-ONLY)
// ---------------------------------------------
// PURPOSE:
// - Streams audit timeline data as CSV
// - Reads ONLY from admin_audit_timeline_v
// - Zero mutation, zero side effects
//
// AUDIT SAFETY:
// - Raw SQL
// - Stable column order
// - Explicit CSV escaping
// - Streaming (no memory buffering)
//

import sequelize from "../../../config/database.js";
import type { Response } from "express";

/* -------------------------------------------------------------------------- */
/* Utilities — CSV Escaping                                                    */
/* -------------------------------------------------------------------------- */
/**
 * Escapes CSV values safely.
 * - Wraps in quotes if needed
 * - Escapes internal quotes
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/* -------------------------------------------------------------------------- */
/* AUDIT EXPORT — CSV STREAM                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Streams audit timeline rows as CSV directly to response.
 *
 * Source:
 *   admin_audit_timeline_v
 *
 * Query params (currently optional, future-ready):
 * - from
 * - to
 * - actorId
 * - cadetId
 * - vesselId
 */
export async function fetchAuditTimelineCsvStream(
  query: Record<string, any>,
  res: Response
): Promise<void> {
  // -------------------------------------------------------------------------
  // 1. Define stable column order (AUDIT CRITICAL)
  // -------------------------------------------------------------------------
  const columns = [
    "occurred_at",
    "actor_name",
    "actor_role",
    "action",
    "entity_type",
    "entity_id",
    "cadet_name",
    "vessel_name",
    "ip_address",
    "user_agent",
  ];

  // Write CSV header row
  res.write(columns.join(",") + "\n");

  // -------------------------------------------------------------------------
  // 2. Build base SQL (filters intentionally minimal for now)
  // -------------------------------------------------------------------------
  const sql = `
    SELECT
      occurred_at,
      actor_name,
      actor_role,
      action,
      entity_type,
      entity_id,
      cadet_name,
      vessel_name,
      ip_address,
      user_agent
    FROM admin_audit_timeline_v
    ORDER BY occurred_at DESC
  `;

  try {
    // -----------------------------------------------------------------------
    // 3. Execute query (raw, audit-safe)
    // -----------------------------------------------------------------------
    const [rows] = await sequelize.query(sql, {
      raw: true,
    });

    // -----------------------------------------------------------------------
    // 4. Stream each row
    // -----------------------------------------------------------------------
    for (const row of rows as any[]) {
      const csvRow = columns
        .map((col) => csvEscape(row[col]))
        .join(",");

      res.write(csvRow + "\n");
    }

    // -----------------------------------------------------------------------
    // 5. End stream cleanly
    // -----------------------------------------------------------------------
    res.end();
  } catch (error) {
    console.error("❌ Failed to stream audit timeline CSV:", error);
    throw error;
  }
}
