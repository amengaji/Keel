// keel-backend/src/admin/services/adminVessels.service.ts
//
// PURPOSE:
// - READ: Fetch audit-safe vessels from admin_vessels_v (DB VIEW)
// - WRITE: Admin-only create / update / soft-delete vessels (TABLE writes)
// - IMPORTANT:
//   • Reads always come from VIEW (audit safe)
//   • Writes always go to TABLE (controlled, validated)
//   • Vessel Types are READ-ONLY system taxonomy
//

import sequelize from "../../config/database.js";
import Vessel from "../../models/Vessel.js";

/* ======================================================================
 * READ-ONLY (AUDIT SAFE)
 * ====================================================================== */

/**
 * Fetch vessels for Admin UI.
 * Source: admin_vessels_v (DB VIEW)
 * NOTE:
 * - No filters
 * - No writes
 * - Audit-safe
 */
export async function fetchAdminVessels() {
  try {
    const [rows] = await sequelize.query(
      `
      SELECT
        vessel_id,
        vessel_name,
        imo_number,
        call_sign,
        mmsi,
        ship_type_id,
        ship_type_name,
        flag,
        port_of_registry,
        classification_society,
        builder,
        year_built,
        gross_tonnage,
        net_tonnage,
        deadweight_tonnage,
        length_overall_m,
        breadth_moulded_m,
        depth_m,
        draught_summer_m,
        main_engine_type,
        main_engine_model,
        main_engine_power_kw,
        service_speed_knots,
        owner_company,
        manager_company,
        operating_area,
        ice_class,
        last_drydock_date,
        next_drydock_date,
        last_special_survey_date,
        next_special_survey_date,
        created_at,
        updated_at
      FROM admin_vessels_v
      ORDER BY vessel_name ASC
      `
    );

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
  const {
    name,
    imo_number,
    ship_type_id,
    ...optionalFields
  } = payload;

  // --- Basic validation (toast-friendly) ---
  if (!name || !imo_number || !ship_type_id) {
    throw new Error("Vessel name, IMO number, and vessel type are required");
  }

  // --- Ensure IMO uniqueness ---
  const existing = await Vessel.findOne({
    where: { imo_number },
  });

  if (existing) {
    throw new Error("A vessel with this IMO number already exists");
  }

  // --- Create vessel ---
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
 * - All other fields are editable
 * - Vessel must exist and be active
 */
export async function updateVessel(vesselId: number, payload: any) {
  const vessel = await Vessel.findOne({
    where: {
      id: vesselId,
      is_active: true,
    },
  });

  if (!vessel) {
    throw new Error("Vessel not found or already deleted");
  }

  // --- Block IMO change explicitly ---
  // NOTE:
  // Sequelize Model is not strongly typed here, so we cast to `any`
  // This avoids unsafe refactors and keeps behavior identical
  const existingImo = (vessel as any).imo_number;

  if (payload.imo_number && payload.imo_number !== existingImo) {
    throw new Error("IMO number cannot be modified after vessel creation");
  }


  // --- Remove IMO if accidentally sent ---
  delete payload.imo_number;

  await vessel.update(payload);

  return vessel;
}

/**
 * Soft delete a vessel
 * ACTION:
 * - Marks vessel as inactive
 * - No physical delete
 * - Audit safe
 */
export async function softDeleteVessel(vesselId: number) {
  const vessel = await Vessel.findOne({
    where: {
      id: vesselId,
      is_active: true,
    },
  });

  if (!vessel) {
    throw new Error("Vessel not found or already deleted");
  }

  await vessel.update({ is_active: false });

  return {
    message: "Vessel deleted successfully",
  };
}
