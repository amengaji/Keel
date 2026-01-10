// keel-backend/src/admin/controllers/adminVesselImports.controller.ts
//
// PURPOSE:
// - HTTP layer for Vessel Excel Imports
// - Template download
// - Preview (NO WRITES)
// - Commit (STRICT, transactional — Policy B)
//
// IMPORTANT:
// - Preview logic is delegated to service
// - Commit logic will be delegated to service
// - Controller stays thin and toast-friendly
//

import { Request, Response } from "express";
import {
  buildVesselImportTemplateXlsxBuffer,
  previewVesselImportXlsx,
  commitVesselImportXlsx,
} from "../services/adminVesselImports.service.js";

/* ======================================================================
 * TEMPLATE DOWNLOAD
 * ====================================================================== */

/**
 * GET /api/v1/admin/imports/vessels/template
 */
export async function downloadVesselImportTemplate(
  req: Request,
  res: Response
) {
  try {
    const buffer = await buildVesselImportTemplateXlsxBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="vessel_import_template.xlsx"'
    );
    res.end(buffer);
  } catch (err) {
    console.error("❌ TEMPLATE ERROR", err);
    res.status(500).json({ success: false });
  }
}

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

/**
 * POST /api/v1/admin/vessels/import/preview
 */
export async function previewVesselImport(req: Request, res: Response) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const preview = await previewVesselImportXlsx(req.file.buffer);

    return res.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error("❌ Vessel import preview failed:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Vessel import preview failed",
    });
  }
}

/* ======================================================================
 * COMMIT (STRICT — Policy B)
 * ====================================================================== */

/**
 * POST /api/v1/admin/imports/vessels/commit
 */
export async function commitVesselImport(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const result = await commitVesselImportXlsx(req.file.buffer);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Vessel import commit failed:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Vessel import commit failed",
    });
  }
}
