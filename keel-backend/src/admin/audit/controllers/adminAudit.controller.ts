// keel-backend/src/admin/audit/controllers/adminAudit.controller.ts
//
// KEEL — Admin Audit Export Controller (READ-ONLY)
// ------------------------------------------------
// PURPOSE:
// - HTTP-facing controller for audit exports
// - Handles headers + streaming response
// - Delegates ALL data access to service layer
//
// IMPORTANT AUDIT RULES:
// - NO database queries here
// - NO data mutation
// - NO JSON wrappers (CSV is streamed directly)
//

import type { Request, Response } from "express";
import { fetchAuditTimelineCsvStream } from "../services/adminAudit.service.js";

/* -------------------------------------------------------------------------- */
/* GET — Audit Timeline CSV Export                                             */
/* -------------------------------------------------------------------------- */
/**
 * Streams audit timeline as CSV.
 *
 * Behaviour:
 * - Sets proper CSV headers
 * - Streams rows safely (memory efficient)
 * - Returns 500 only on fatal export errors
 */
export async function exportAuditTimelineCsv(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // -----------------------------------------------------------------------
    // 1. Prepare CSV headers (audit-grade, browser friendly)
    // -----------------------------------------------------------------------
    const today = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="keel_audit_timeline_${today}.csv"`
    );

    // Prevent proxies / browsers from caching audit exports
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    // -----------------------------------------------------------------------
    // 2. Delegate streaming to service layer
    // -----------------------------------------------------------------------
    await fetchAuditTimelineCsvStream(req.query, res);

  } catch (error) {
    console.error("❌ Audit CSV export failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to export audit timeline CSV",
      });
    }
  }
}
