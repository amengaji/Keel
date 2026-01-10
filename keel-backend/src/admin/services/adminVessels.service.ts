// keel-backend/src/admin/services/adminVessels.service.ts
//
// PURPOSE:
// - READ: Fetch audit-safe vessels from admin_vessels_v (DB VIEW)
// - WRITE: Admin-only create / update / soft-delete vessels (TABLE writes)
// - IMPORTANT:
//   • Reads always come from VIEW (audit safe)
//   • Writes always go to TABLE (controlled, validated)
//   • Service MUST match view contract exactly
//

import sequelize from "../../config/database.js";
import Vessel from "../../models/Vessel.js";

/* ======================================================================
 * READ-ONLY (AUDIT SAFE)
 * ====================================================================== */

/**
 * Fetch vessels for Admin UI.
 * Source: admin_vessels_v (DB VIEW)
 *
 * CONTRACT:
 * - Column list MUST match view definition
 * - NO optional / speculative fields allowed
 */
export async function fetchAdminVessels() {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        vessel_id,
        vessel_name,
        imo_number,
        ship_type_id,
        ship_type_name,
        flag,
        classification_society,
        is_active,
        vessel_status,
        cadets_onboard,
        active_trbs
      FROM admin_vessels_v
      ORDER BY vessel_name ASC
    `);

    return rows;
  } catch (error) {
    console.error("❌ Failed to fetch admin vessels:", error);
    throw error;
  }
}

/* ======================================================================
 * WRITE OPERATIONS (ADMIN ONLY)
 * ====================================================================== */

/**
 * Create a new vessel
 * RULES:
 * - IMO is mandatory and must be unique
 * - ship_type_id is mandatory
 * - is_active defaults to true
 */
export async function createVessel(payload: any) {
  const { name, imo_number, ship_type_id, ...optionalFields } = payload;

  if (!name || !imo_number || !ship_type_id) {
    throw new Error("Vessel name, IMO number, and vessel type are required");
  }

  const existing = await Vessel.findOne({
    where: { imo_number },
  });

  if (existing) {
    throw new Error("A vessel with this IMO number already exists");
  }

  const vessel = await Vessel.create({
    name,
    imo_number,
    ship_type_id,
    ...optionalFields,
    is_active: true,
  });

  return vessel;
}

/**
 * Update an existing vessel
 * RULES:
 * - IMO number CANNOT be changed after creation
 * - Vessel must be active
 */
export async function updateVessel(vesselId: number, payload: any) {
  const vessel = await Vessel.findOne({
    where: { id: vesselId, is_active: true },
  });

  if (!vessel) {
    throw new Error("Vessel not found or already deleted");
  }

  const existingImo = (vessel as any).imo_number;

  if (payload.imo_number && payload.imo_number !== existingImo) {
    throw new Error("IMO number cannot be modified after vessel creation");
  }

  delete payload.imo_number;

  await vessel.update(payload);

  return vessel;
}

/**
 * Soft delete a vessel (audit-safe)
 */
export async function softDeleteVessel(vesselId: number) {
  const vessel = await Vessel.findOne({
    where: { id: vesselId, is_active: true },
  });

  if (!vessel) {
    throw new Error("Vessel not found or already deleted");
  }

  await vessel.update({ is_active: false });

  return { message: "Vessel deleted successfully" };
}

/**
 * Restore (unarchive) a vessel
 */
export async function restoreVessel(vesselId: number) {
  const vessel = await Vessel.findOne({
    where: { id: vesselId, is_active: false },
  });

  if (!vessel) {
    throw new Error("Vessel not found or already active");
  }

  await vessel.update({ is_active: true });

  return { message: "Vessel restored successfully" };
}
