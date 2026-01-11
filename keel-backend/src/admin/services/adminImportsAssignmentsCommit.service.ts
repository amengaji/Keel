import sequelize from "../../config/database.js";
import { CadetVesselAssignment } from "../../models/index.js";
import { previewAssignmentImportXlsx } from "./adminImportsAssignments.service.js";

export async function commitAssignmentImportXlsx(buffer: Buffer, adminUserId: number) {
  const preview = await previewAssignmentImportXlsx(buffer);

  if (preview.summary.fail > 0) {
    throw new Error(`Commit blocked: ${preview.summary.fail} rows failed validation.`);
  }

  if (preview.summary.ready === 0) {
    return { success: true, count: 0, message: "No rows to import." };
  }

  const transaction = await sequelize.transaction();
  let count = 0;

  try {
    for (const row of preview.rows) {
      if (row.status !== "READY") continue;

      await CadetVesselAssignment.create({
        cadet_id: row.derived.cadet_id,
        vessel_id: row.derived.vessel_id,
        date_joined: row.normalized.date_joined,
        date_left: row.normalized.date_left,
        current_rank: row.normalized.rank,
        assigned_by_user_id: adminUserId,
        active: !row.normalized.date_left, // Active if no leave date
      }, { transaction });

      count++;
    }

    await transaction.commit();
    return { success: true, count, message: `Imported ${count} assignments.` };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}