import sequelize from "../../config/database.js";
import { TaskTemplate } from "../../models/index.js";
import { v4 as uuidv4 } from "uuid";
import {
  previewTaskImportXlsx,
} from "./adminImportsTasks.service.js";

export type TaskImportCommitResult = {
  import_batch_id: string;
  success: boolean;
  imported_count: number;
  skipped_count: number;
  notes: string[];
};

export async function commitTaskImportXlsx(
  buffer: Buffer
): Promise<TaskImportCommitResult> {
  const import_batch_id = uuidv4();
  
  // 1. Re-run Preview
  const preview = await previewTaskImportXlsx(buffer);

  if (preview.summary.fail > 0) {
    throw new Error(`Cannot commit: ${preview.summary.fail} rows failed validation.`);
  }

  if (preview.summary.ready === 0) {
    return {
      import_batch_id,
      success: true,
      imported_count: 0,
      skipped_count: 0,
      notes: ["No ready rows to import."],
    };
  }

  // 2. Transactional Write
  const transaction = await sequelize.transaction();
  let imported = 0;
  let skipped = 0;

  try {
    for (const row of preview.rows) {
      if (row.status !== "READY") continue;

      const {
        part_number,
        section_name,
        title,
        description,
        stcw_reference,
        mandatory_for_all,
        department, // <--- READ THIS
      } = row.normalized;

      const { ship_type_id } = row.derived;

      // Check for existing task (Title + ShipType Context)
      const existing = await TaskTemplate.findOne({
        where: {
          title: title!,
          ship_type_id: ship_type_id,
        },
        transaction,
      });

      if (existing) {
        skipped++;
        continue;
      }

      await TaskTemplate.create(
        {
          part_number,
          section_name,
          title: title!,
          description,
          stcw_reference,
          mandatory_for_all,
          ship_type_id,
          department, // <--- SAVE THIS
        },
        { transaction }
      );
      imported++;
    }

    await transaction.commit();

    return {
      import_batch_id,
      success: true,
      imported_count: imported,
      skipped_count: skipped,
      notes: [`Successfully imported ${imported} tasks.`, `Skipped ${skipped} duplicates.`],
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
