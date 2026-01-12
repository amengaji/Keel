// keel-backend/src/admin/services/adminTrainees.service.ts
//
// PURPOSE:
// - READ (A): Fetch Cadet IDENTITY registry (users-based, no assignment)
// - READ (B): Fetch Trainees with TRB / assignment context (audit-safe)
// - WRITE: Create / Update Cadet identity ONLY
//
// IMPORTANT:
// - Cadet Registry ≠ Training Progress
// - Cadet Registry is assignment-agnostic
// - TRB views remain untouched and audit-safe
// - NO soft delete in Phase 2 (schema not ready)
//

import sequelize from "../../config/database.js";
import User from "../../models/User.js";
import Role from "../../models/Role.js";

/* ======================================================================
 * READ — CADET IDENTITY REGISTRY (USERS-BASED)
 * ====================================================================== */

/**
 * Fetch all Cadets (identity only)
 *
 * SOURCE:
 * - users
 * - roles
 *
 * PURPOSE:
 * - AdminCadetsPage
 * - Create / Edit / (Future Delete) cadets
 *
 * EXCLUDES:
 * - Vessel assignment
 * - TRB progress
 * - Audit state
 */
export async function fetchAdminCadets() {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        u.id            AS cadet_id,
        u.email         AS cadet_email,
        u.full_name     AS cadet_name,
        u.gender        AS gender,
        u.nationality   AS nationality,
        u."createdAt"   AS created_at,
        u."updatedAt"   AS updated_at,
        r.role_name     AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.role_name = 'CADET'
      ORDER BY u.full_name ASC
    `);

    return rows;
  } catch (error) {
    console.error("❌ Failed to fetch admin cadets:", error);
    throw error;
  }
}

/* ======================================================================
 * READ — TRAINEES WITH TRAINING / TRB CONTEXT (VIEW-BASED)
 * ====================================================================== */

/**
 * Fetch Trainees with assignment + TRB progress
 *
 * SOURCE:
 * - admin_trb_cadets_v (DB VIEW)
 *
 * PURPOSE:
 * - Training Progress page
 * - Audit / Compliance
 *
 * NOTE:
 * - Cadets without assignment WILL NOT appear here
 */
export async function fetchAdminTrainees() {
  try {
    const [rows] = await sequelize.query(`
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
    `);

    return rows;
  } catch (error) {
    console.error("❌ Failed to fetch admin trainees:", error);
    throw error;
  }
}

/* ======================================================================
 * WRITE — CREATE CADET (IDENTITY ONLY)
 * ====================================================================== */

/**
 * Create a new Cadet (identity only)
 *
 * CURRENT PHASE:
 * - Creates user with CADET role
 * - No vessel assignment
 * - No TRB
 */
export async function createTrainee(payload: any) {
  const transaction = await sequelize.transaction();

  try {
    const { email, full_name } = payload;

    // ------------------ VALIDATION ------------------
    if (!email || !full_name) {
      throw new Error("Required trainee fields are missing");
    }

    // ------------------ EMAIL UNIQUENESS ------------------
    const existingUser = await User.findOne({
      where: { email },
      transaction,
    });

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // ------------------ FETCH CADET ROLE ------------------
    const cadetRole = await Role.findOne({
      where: { role_name: "CADET" },
      transaction,
    });

    if (!cadetRole) {
      throw new Error("CADET role not found");
    }

    // ------------------ CREATE USER ------------------
    await User.create(
      {
        email,
        full_name,
        password_hash: "TEMP", // placeholder (Phase 3 auth flow)
        role_id: (cadetRole as any).id,
      } as any,
      { transaction }
    );

    await transaction.commit();

    return { message: "Cadet created successfully" };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Failed to create cadet:", error);
    throw error;
  }
}

/* ======================================================================
 * WRITE — UPDATE CADET (IDENTITY ONLY)
 * ====================================================================== */

/**
 * Update Cadet identity
 *
 * ALLOWED:
 * - full_name
 * - email (must remain unique)
 */
export async function updateTrainee(
  cadetId: number,
  payload: { full_name?: string; email?: string }
) {
  const { full_name, email } = payload;

  const user = await User.findOne({
    where: { id: cadetId },
  });

  if (!user) {
    throw new Error("Cadet not found");
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error("Another user already uses this email");
    }
  }

  await user.update({
    ...(full_name && { full_name }),
    ...(email && { email }),
  });

  return { message: "Cadet updated successfully" };
}

/* ======================================================================
 * DELETE — BLOCKED (PHASE 2)
 * ====================================================================== */

/**
 * Delete Cadet
 *
 * PHASE 2 RULE:
 * - Deletion is NOT allowed
 * - Prevents audit & training data corruption
 *
 * FUTURE:
 * - Will become soft delete once is_active exists
 */
export async function deleteTrainee(_cadetId: number) {
  throw new Error(
    "Cadet deletion is disabled in Phase 2. Use assignments or archive flows instead."
  );
}
