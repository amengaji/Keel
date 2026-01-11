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

// ------------------ CHECK TRAINING ON ACTIVE ASSIGNMENT ONLY ------------------
//
// AUTHORITATIVE RULE (Phase 4E+):
// - Training history MUST NOT block reassignment
// - Reassignment is blocked ONLY if there is an ACTIVE assignment
// - Training tied to COMPLETED assignments is historical evidence
//
// We therefore DO NOT query admin_trb_cadets_v blindly.
//
// ACTIVE assignment check is sufficient and audit-correct.


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
