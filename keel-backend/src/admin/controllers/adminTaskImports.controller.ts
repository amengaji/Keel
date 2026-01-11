import { Request, Response } from "express";
import {
  buildCadetImportTemplateXlsxBuffer,
  previewCadetImportXlsx,
} from "../services/adminImports.service.js";
import { commitCadetImportXlsx } from "../services/adminImportsCadetsCommit.service.js";
import {
  buildTaskImportTemplateXlsxBuffer,
  previewTaskImportXlsx,
} from "../services/adminImportsTasks.service.js";
import { commitTaskImportXlsx } from "../services/adminImportsTasksCommit.service.js";
import {
  buildAssignmentImportTemplateXlsxBuffer,
  previewAssignmentImportXlsx,
} from "../services/adminImportsAssignments.service.js";
import { commitAssignmentImportXlsx } from "../services/adminImportsAssignmentsCommit.service.js";

/* ======================================================================
 * SMALL HELPERS
 * ====================================================================== */

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

function assertAdminOrThrow(req: Request) {
  const roleName = getRoleNameFromRequest(req);
  if (roleName !== "ADMIN") {
    const hint = roleName ? `Current role: ${roleName}` : "Role not found on request";
    throw new Error(`Forbidden: ADMIN only. (${hint})`);
  }
}

/* ======================================================================
 * CADETS
 * ====================================================================== */

export async function downloadCadetImportTemplate(req: Request, res: Response) {
  try {
    const buffer = await buildCadetImportTemplateXlsxBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="keel_cadet_import_template.xlsx"`);
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function previewCadetImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file?.buffer) return res.status(400).json({ success: false, message: 'File required' });
    const result = await previewCadetImportXlsx(file.buffer);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function commitCadetImport(req: Request, res: Response) {
  try {
    assertAdminOrThrow(req);
    const file = (req as any).file;
    if (!file?.buffer) return res.status(400).json({ success: false, message: 'File required' });
    const result = await commitCadetImportXlsx(file.buffer);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

/* ======================================================================
 * TASKS
 * ====================================================================== */

export async function downloadTaskImportTemplate(req: Request, res: Response) {
  try {
    const buffer = await buildTaskImportTemplateXlsxBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="keel_task_import_template.xlsx"`);
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function previewTaskImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file?.buffer) throw new Error("File required");
    const result = await previewTaskImportXlsx(file.buffer);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function commitTaskImport(req: Request, res: Response) {
  try {
    assertAdminOrThrow(req);
    const file = (req as any).file;
    if (!file?.buffer) throw new Error("File required");
    const result = await commitTaskImportXlsx(file.buffer);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

/* ======================================================================
 * ASSIGNMENTS
 * ====================================================================== */

export async function downloadAssignmentImportTemplate(req: Request, res: Response) {
  try {
    const buffer = await buildAssignmentImportTemplateXlsxBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="keel_assignments_template.xlsx"`);
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function previewAssignmentImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file?.buffer) throw new Error("File required");
    const result = await previewAssignmentImportXlsx(file.buffer);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}

export async function commitAssignmentImport(req: Request, res: Response) {
  try {
    assertAdminOrThrow(req);
    const file = (req as any).file;
    if (!file?.buffer) throw new Error("File required");
    
    // We assume request user is populated by auth middleware
    const adminId = (req as any).user?.id || 1; 

    const result = await commitAssignmentImportXlsx(file.buffer, adminId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message });
  }
}
