// keel-backend/src/admin/services/adminVessels.service.ts
//
// PURPOSE:
// - Fetch read-only Vessels for Shore Admin UI
// - Data source: admin_vessels_v (DB VIEW)
// - NO writes, NO filters, audit-safe
//

import sequelize from "../../config/database.js";

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
