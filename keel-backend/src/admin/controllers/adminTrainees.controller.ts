// keel-backend/src/admin/controllers/adminTrainees.controller.ts
//
// PURPOSE:
// - HTTP controllers for Admin Cadets / Trainees
// - Phase 2 safe (no restore, no delete)
//

import { Request, Response } from "express";
import {
  fetchAdminCadets,
  fetchAdminTrainees,
  createTrainee,
  updateTrainee,
  deleteTrainee,
} from "../services/adminTrainees.service.js";

/* ======================================================================
 * READ — CADET IDENTITY REGISTRY
 * ====================================================================== */

/**
 * GET /api/v1/admin/cadets
 */
export async function getAdminCadets(req: Request, res: Response) {
  try {
    const data = await fetchAdminCadets();
    // This ensures the response is ALWAYS JSON
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch cadets",
    });
  }
}

/* ======================================================================
 * READ — TRAINEES (TRAINING / TRB VIEW)
 * ====================================================================== */

/**
 * GET /api/v1/admin/trainees
 */
export async function getAdminTrainees(
  req: Request,
  res: Response
) {
  try {
    const data = await fetchAdminTrainees();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch trainees",
    });
  }
}

/* ======================================================================
 * WRITE — CREATE CADET
 * ====================================================================== */

/**
 * POST /api/v1/admin/cadets
 */
export async function createAdminTrainee(
  req: Request,
  res: Response
) {
  try {
    await createTrainee(req.body);
    res.status(201).json({
      success: true,
      message: "Cadet created successfully",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Unable to create cadet",
    });
  }
}

/* ======================================================================
 * WRITE — UPDATE CADET
 * ====================================================================== */

/**
 * PUT /api/v1/admin/cadets/:cadetId
 */
export async function updateAdminTrainee(
  req: Request,
  res: Response
) {
  try {
    const cadetId = Number(req.params.cadetId);
    await updateTrainee(cadetId, req.body);

    res.json({
      success: true,
      message: "Cadet updated successfully",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Unable to update cadet",
    });
  }
}

/* ======================================================================
 * DELETE — BLOCKED (PHASE 2)
 * ====================================================================== */

/**
 * DELETE /api/v1/admin/cadets/:cadetId
 */
export async function deleteAdminTrainee(
  req: Request,
  res: Response
) {
  try {
    const cadetId = Number(req.params.cadetId);
    await deleteTrainee(cadetId);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
