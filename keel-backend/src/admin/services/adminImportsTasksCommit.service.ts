import sequelize from "../../config/database.js";
import { TaskTemplate } from "../../models/index.js";
import { v4 as uuidv4 } from "uuid";
import { previewTaskImportXlsx } from "./adminImportsTasks.service.js";

export async function commitTaskImportXlsx(buffer: Buffer) {
  const preview = await previewTaskImportXlsx(buffer);
  if (preview.summary.fail > 0) throw new Error(`${preview.summary.fail} rows failed validation.`);

  const transaction = await sequelize.transaction();
  let imported = 0, skipped = 0;

  try {
    for (const row of preview.rows) {
      if (row.status !== "READY") continue;
      const n = row.normalized;

      const existing = await TaskTemplate.findOne({
        where: { title: n.title!, ship_type_id: row.derived.ship_type_id },
        transaction
      });

      if (existing) { skipped++; continue; }

      await TaskTemplate.create({
        part_number: n.part_number,
        section_name: n.section_name,
        title: n.title!,
        description: n.description,
        stcw_reference: n.stcw_reference,
        mandatory_for_all: n.mandatory_for_all,
        ship_type_id: row.derived.ship_type_id,
        department: n.department,
        trainee_type: n.trainee_type, // <--- SAVE NEW FIELD
        instructions: n.instructions,
        safety_requirements: n.safety_requirements,
        evidence_type: n.evidence_type,
        verification_method: n.verification_method,
        frequency: n.frequency,
      }, { transaction });
      imported++;
    }
    await transaction.commit();
    return { success: true, imported_count: imported, skipped_count: skipped, notes: [] };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
