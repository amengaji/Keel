// keel-backend/src/admin/services/adminShipTypes.service.ts
//
// PURPOSE:
// - Fetch read-only Ship Types for Shore Admin UI
// - Data source: admin_ship_types_v (DB VIEW)
// - NO writes, NO mutations, audit-safe
//

import sequelize from "../../config/database.js";

export async function fetchAdminShipTypes() {
  try {
    const [rows] = await sequelize.query(
      `
      SELECT
        ship_type_id,
        type_code,
        name,
        description,
        created_at,
        updated_at
      FROM admin_ship_types_v
      ORDER BY name ASC
      `
    );

    return rows;
  } catch (error) {
    console.error("❌ Failed to fetch admin ship types:", error);
    throw error;
  }
}
