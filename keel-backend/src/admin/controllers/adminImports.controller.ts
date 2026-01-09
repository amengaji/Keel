// keel-backend/src/admin/controllers/adminImports.controller.ts
//
// PURPOSE:
// - Imports controller (Preview-first, audit-safe)
// - Preview parses + validates only (no writes)
// - Commit performs strict transactional writes (admin-only)
//
// ROUTES:
// - GET  /api/v1/admin/imports/cadets/template
// - POST /api/v1/admin/imports/cadets/preview
// - POST /api/v1/admin/imports/cadets/commit
//

import { Request, Response } from "express";
import {
  buildCadetImportTemplateXlsxBuffer,
  previewCadetImportXlsx,
} from "../services/adminImports.service.js";
import { commitCadetImportXlsx } from "../services/adminImportsCadetsCommit.service.js";

/* ======================================================================
 * SMALL HELPERS (kept here to avoid auth shape guessing elsewhere)
 * ====================================================================== */

/**
 * Extract role name from req.user across common shapes.
 * This avoids fragile assumptions about how authGuard attaches the user.
 */
function getRoleNameFromRequest(req: Request): string | null {
  const u = (req as any)?.user;
  if (!u) return null;

  const role =
    u.role_name ??
    u.roleName ??
    u.role ??
    u?.role?.role_name ??
    u?.role?.name ??
    null;

  return role ? String(role).toUpperCase() : null;
}

/**
 * Strict admin gate for COMMIT.
 * Preview can remain available to any authenticated admin user if you later decide so,
 * but commit must be ADMIN-only for safety.
 */
function assertAdminOrThrow(req: Request) {
  const roleName = getRoleNameFromRequest(req);
  if (roleName !== "ADMIN") {
    const hint = roleName ? `Current role: ${roleName}` : "Role not found on request";
    throw new Error(`Forbidden: ADMIN only. (${hint})`);
  }
}

/* ======================================================================
 * TEMPLATE DOWNLOAD
 * ====================================================================== */

export async function downloadCadetImportTemplate(req: Request, res: Response) {
  try {
    const buffer = buildCadetImportTemplateXlsxBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="keel_cadet_import_template.xlsx"`
    );

    return res.status(200).send(buffer);
  } catch (err: any) {
    console.error("❌ Template download failed:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Unable to generate template",
    });
  }
}

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

export async function previewCadetImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;

    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required (field name: file)',
      });
    }

    const result = await previewCadetImportXlsx(file.buffer);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("❌ Import preview failed:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Unable to preview import",
    });
  }
}

/* ======================================================================
 * COMMIT (STRICT WRITES; ADMIN-ONLY; TRANSACTION)
 * ====================================================================== */

export async function commitCadetImport(req: Request, res: Response) {
  try {
    // ---------- ADMIN GATE ----------
    assertAdminOrThrow(req);

    // ---------- FILE ----------
    const file = (req as any).file;
    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required (field name: file)',
      });
    }

    // ---------- COMMIT ----------
    const result = await commitCadetImportXlsx(file.buffer);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("❌ Import commit failed:", err);

    // For forbidden, return 403
    const msg = err?.message || "Unable to commit import";
    if (String(msg).toLowerCase().includes("forbidden")) {
      return res.status(403).json({ success: false, message: msg });
    }

    return res.status(400).json({
      success: false,
      message: msg,
      // If service attached structured details, include them for UI visibility
      ...(err?.data ? { data: err.data } : {}),
    });
  }
}
