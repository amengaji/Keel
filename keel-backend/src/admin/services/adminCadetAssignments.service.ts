// keel-backend/src/admin/services/adminCadetAssignments.service.ts
//
// PURPOSE:
// - Admin-only Cadet → Vessel assignment
// - Audit-safe, transactional
// - READ History & WRITE Assignment
//

import sequelize from "../../config/database.js";
import CadetVesselAssignment from "../../models/CadetVesselAssignment.js";
import User from "../../models/User.js";
import Vessel from "../../models/Vessel.js";
import Role from "../../models/Role.js";

/* ======================================================================
 * WRITE: ASSIGN CADET
 * ====================================================================== */

export async function assignCadetToVessel(
  cadetId: number,
  vesselId: number
) {
  const transaction = await sequelize.transaction();

  try {
    // ------------------ VALIDATE CADET ------------------
    const cadet = await User.findByPk(cadetId, {
      include: [{ model: Role, as: "role" }],
      transaction,
    });

    if (!cadet) {
      throw new Error("Cadet not found");
    }

    if ((cadet as any).role?.role_name !== "CADET") {
      throw new Error("User is not a cadet");
    }

    // ------------------ VALIDATE VESSEL ------------------
    const vessel = await Vessel.findByPk(vesselId, { transaction });
    if (!vessel) {
      throw new Error("Vessel not found");
    }

    // ------------------ CHECK EXISTING ACTIVE ASSIGNMENT ------------------
    // We only care if they currently have an "ACTIVE" assignment.
    // We removed the TRB activity check to allow reassignment/first assignment.
    const existing = await CadetVesselAssignment.findOne({
      where: {
        cadet_id: cadetId,
        status: "ACTIVE",
      },
      transaction,
    });

    if (existing) {
      throw new Error("Cadet already has an active vessel assignment. Close the current one first.");
    }

    // ------------------ CREATE ASSIGNMENT ------------------
    const today = new Date().toISOString().slice(0, 10);

    const assignment = await CadetVesselAssignment.create(
      {
        cadet_id: cadetId,
        vessel_id: vesselId,
        start_date: today,
        status: "ACTIVE",
      },
      { transaction }
    );

    await transaction.commit();

    return {
      assignment_id: assignment.id,
      cadet_id: cadetId,
      vessel_id: vesselId,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Admin assignment failed:", error);
    throw error;
  }
}

/* ======================================================================
 * READ: ASSIGNMENT HISTORY
 * ====================================================================== */

export async function fetchAssignmentHistory() {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        cva.id              AS id,
        u.full_name         AS "cadetName",
        u.email             AS "cadetEmail",
        v.name              AS "vesselName",
        v.imo_number        AS "imo",
        cva.start_date      AS "assignedOn",
        cva.status          AS "status",
        cva."createdAt"     AS "createdAt"
      FROM cadet_vessel_assignments cva
      JOIN users u ON u.id = cva.cadet_id
      JOIN vessels v ON v.id = cva.vessel_id
      ORDER BY cva."createdAt" DESC
    `);

    // Map to UI-friendly structure
    return (rows as any[]).map((row) => ({
      id: String(row.id),
      cadetName: row.cadetName || row.cadetEmail, // Fallback if name empty
      cadetStream: "Cadet", // Default (Schema update required for Rank)
      vesselName: row.vesselName,
      imo: `IMO ${row.imo}`,
      assignedBy: "SHORE_ADMIN", // Default (Identity logging in Phase 3)
      assignedOn: row.assignedOn,
      isCurrent: row.status === "ACTIVE",
    }));
  } catch (error) {
    console.error("❌ Fetch assignment history failed:", error);
    throw error;
  }
}