// keel-backend/src/admin/services/adminCadetAssignments.service.ts
//
// PURPOSE:
// - Admin-only Cadet → Vessel assignment
// - Audit-safe, transactional
//
// RULES:
// - One ACTIVE assignment per cadet
// - No silent overwrite
// - No deletes
//

import sequelize from "../../config/database.js";
import CadetVesselAssignment from "../../models/CadetVesselAssignment.js";
import User from "../../models/User.js";
import Vessel from "../../models/Vessel.js";
import Role from "../../models/Role.js";

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

    // ------------------ CHECK TRB ACTIVITY (PHASE 4A-4 LOCK) ------------------
    // RULE:
    // - If cadet has ANY training/TRB activity, reassignment must be blocked.
    //
    // SOURCE OF TRUTH:
    // - admin_trb_cadets_v (view used by /api/v1/admin/trainees)
    //
    // NOTE:
    // - We intentionally treat "presence in view" as training activity exists.
    // - This keeps logic consistent with your view-driven audit reporting.
    const [trbRows] = await sequelize.query(
      `
        SELECT 1
        FROM admin_trb_cadets_v
        WHERE cadet_id = :cadetId
        LIMIT 1
      `,
      {
        replacements: { cadetId },
        transaction,
      }
    );

    if (Array.isArray(trbRows) && trbRows.length > 0) {
      throw new Error(
        "Cadet has existing training activity and cannot be reassigned"
      );
    }

    // ------------------ CHECK EXISTING ACTIVE ASSIGNMENT ------------------
    // RULE:
    // - A cadet cannot have more than one ACTIVE assignment at any time.
    const existing = await CadetVesselAssignment.findOne({
      where: {
        cadet_id: cadetId,
        status: "ACTIVE",
      },
      transaction,
    });

    if (existing) {
      throw new Error("Cadet already has an active vessel assignment");
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
