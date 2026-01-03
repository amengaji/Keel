// keel-backend/src/admin/controllers/adminTrb.controller.ts
//
// KEEL — Admin TRB & Familiarisation Controllers (READ-ONLY)
// -----------------------------------------------------------
// PURPOSE:
// - HTTP-facing layer for Shore Admin TRB screens
// - Delegates all data access to service layer
// - Ensures consistent API response shape
//
// IMPORTANT:
// - No SQL here
// - No DB access here
// - No mutation logic
//

import type { Request, Response } from "express";

import {
  fetchAdminTrbCadets,
  fetchAdminTrbSections,
  fetchAdminTrbEvidence,
} from "../services/adminTrb.service.js";

/* -------------------------------------------------------------------------- */
/* GET — Admin TRB Cadets Overview                                             */
/* -------------------------------------------------------------------------- */
export async function getAdminTrbCadets(
  req: Request,
  res: Response
): Promise<Response> {
  const result = await fetchAdminTrbCadets();

  if (!result.success) {
    return res.status(500).json(result);
  }

  return res.json(result);
}

/* -------------------------------------------------------------------------- */
/* GET — Admin TRB Section Progress                                            */
/* -------------------------------------------------------------------------- */
export async function getAdminTrbSections(
  req: Request,
  res: Response
): Promise<Response> {
  const result = await fetchAdminTrbSections();

  if (!result.success) {
    return res.status(500).json(result);
  }

  return res.json(result);
}

/* -------------------------------------------------------------------------- */
/* GET — Admin TRB Task Evidence                                               */
/* -------------------------------------------------------------------------- */
export async function getAdminTrbEvidence(
  req: Request,
  res: Response
): Promise<Response> {
  const result = await fetchAdminTrbEvidence();

  if (!result.success) {
    return res.status(500).json(result);
  }

  return res.json(result);
}
