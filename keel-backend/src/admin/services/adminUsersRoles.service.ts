//keel-backend/src/admin/services/adminUsersRoles.service.ts
//
// PURPOSE:
// - Read-only data access for Shore Admin (Users & Roles)
// - Reads exclusively from admin_*_v database views
//
// IMPORTANT:
// - NO Sequelize models used
// - NO writes possible
// - Uses raw SELECT queries only
//

import sequelize from "../../config/database.js";

/**
 * Fetch all shore users (non-cadet)
 * Data source: admin_users_v
 */
export async function fetchAdminUsers(companyId: number) {
    const [rows] = await sequelize.query(
      `
      SELECT
        user_id,
        full_name,
        email,
        role_name,
        current_vessel_id,
        created_at,
        updated_at
      FROM admin_users_v
      ORDER BY created_at DESC
      `
    );


  return rows;
}

/**
 * Fetch system-defined roles
 * Data source: admin_roles_v
 */
export async function fetchAdminRoles() {
  console.log("🧪 fetchAdminRoles() CALLED");

  const [rows] = await sequelize.query(
    `
    SELECT
      role_id,
      role_name
    FROM admin_roles_v
    ORDER BY role_name ASC
    `
  );

  return rows;
}
