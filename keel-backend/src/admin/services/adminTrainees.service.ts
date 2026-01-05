// keel-backend/src/admin/services/adminTrainees.service.ts
//
// PURPOSE:
// - READ: Fetch audit-safe trainees from admin_trb_cadets_v (DB VIEW)
// - WRITE: Create new Trainee (Cadet) with vessel assignment
//
// IMPORTANT:
// - Reads always come from VIEW (audit safe)
// - Writes always go to BASE TABLES (users, cadet_vessel_assignments)
// - No schema mutations here
//

import sequelize from "../../config/database.js";
import User from "../../models/User.js";
import Role from "../../models/Role.js";

/* ======================================================================
 * READ-ONLY (AUDIT SAFE)
 * ====================================================================== */

export async function fetchAdminTrainees() {
  try {
    const [rows] = await sequelize.query(
      `
      SELECT
        assignment_id,
        cadet_id,
        cadet_email,
        vessel_id,
        vessel_name,
        ship_type_name,
        assignment_start_date,
        assignment_end_date,
        total_tasks,
        tasks_master_approved,
        completion_percentage,
        last_activity_at,
        overall_status
      FROM admin_trb_cadets_v
      ORDER BY cadet_email ASC
      `
    );

    return rows;
  } catch (error) {
    console.error("❌ Failed to fetch admin trainees:", error);
    throw error;
  }
}

/* ======================================================================
 * WRITE (ADMIN ONLY)
 * ====================================================================== */

/**
 * Create a new Trainee (Cadet)
 *
 * FLOW:
 * 1. Create User with CADET role
 * 2. Assign cadet to vessel (cadet_vessel_assignments)
 *
 * NOTE:
 * - Email must be unique
 * - full_name is required (no first/last split in backend)
 */
export async function createTrainee(payload: any) {
  const transaction = await sequelize.transaction();

  try {
    const {
      email,
      full_name,
      vessel_id,
      assignment_start_date,
      assignment_end_date,
    } = payload;

    // ------------------ BASIC VALIDATION ------------------
    if (!email || !full_name || !vessel_id || !assignment_start_date) {
      throw new Error("Required trainee fields are missing");
    }

    // ------------------ ENSURE EMAIL UNIQUE ------------------
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // ------------------ FETCH CADET ROLE ------------------
    const cadetRole = (await Role.findOne({
      where: { role_name: "CADET" },
      transaction,
    })) as Role | null;

    if (!cadetRole) {
      throw new Error("CADET role not found");
    }

    // ------------------ CREATE USER ------------------
    const user = await User.create(
      {
        email,
        full_name,
        password_hash: "TEMP", // placeholder; real flow later
        role_id: (cadetRole as any).id,
        is_active: true,
      } as any,
      { transaction }
    );

    // ------------------ CREATE VESSEL ASSIGNMENT ------------------
    await sequelize.query(
      `
      INSERT INTO cadet_vessel_assignments
        (cadet_id, vessel_id, start_date, end_date, status, "createdAt", "updatedAt")
      VALUES
        (:cadet_id, :vessel_id, :start_date, :end_date, 'ACTIVE', NOW(), NOW())
      `,
      {
        replacements: {
          cadet_id: user.id,
          vessel_id,
          start_date: assignment_start_date,
          end_date: assignment_end_date || null,
        },
        transaction,
      }
    );

    await transaction.commit();

    return {
      message: "Trainee created successfully",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Failed to create trainee:", error);
    throw error;
  }
}
