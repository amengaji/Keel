// src/routes/famStructureBulk.routes.ts
import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";

const router = Router();

type ConflictStrategy = "SKIP" | "UPDATE" | "OVERWRITE";

interface FamStructureRow {
  ship_type_id: number;
  cadet_category: string;
  section_code: string;
  section_title: string;
  section_order: number;
  task_code: string;
  task_description: string;
  task_order: number;
  is_mandatory?: boolean;
}

/**
 * ------------------------------------------------
 * BULK IMPORT FAMILIARISATION STRUCTURE
 * POST /fam-structure/bulk
 * Body:
 * {
 *   conflictStrategy: "SKIP" | "UPDATE" | "OVERWRITE",
 *   rows: FamStructureRow[]
 * }
 * ------------------------------------------------
 */
router.post(
  "/",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const rows = req.body.rows as FamStructureRow[];
      let conflictStrategy = (req.body.conflictStrategy || "SKIP") as string;

      // 1) Basic validations
      if (!Array.isArray(rows) || rows.length === 0) {
        return res
          .status(400)
          .json({ message: "rows[] is required and must not be empty" });
      }

      conflictStrategy = conflictStrategy.toUpperCase();
      const allowed: ConflictStrategy[] = ["SKIP", "UPDATE", "OVERWRITE"];

      if (!allowed.includes(conflictStrategy as ConflictStrategy)) {
        return res.status(400).json({
          message: "conflictStrategy must be one of: SKIP, UPDATE, OVERWRITE",
        });
      }

      // 2) Normalise text fields
      for (const row of rows) {
        row.cadet_category = row.cadet_category.toUpperCase().trim();
        row.section_code = row.section_code.toUpperCase().trim();
      }

      // 3) Figure out unique sections from rows
      const sectionKeyToId: Record<string, number> = {};
      const sectionsNeedingOverwrite = new Set<number>();

      const uniqueSectionKeys = Array.from(
        new Set(
          rows.map(
            (r) =>
              `${r.ship_type_id}::${r.cadet_category}::${r.section_code}`
          )
        )
      );

      // 4) Create/Update sections based on strategy
      for (const key of uniqueSectionKeys) {
        const [ship_type_id_raw, cadet_category, section_code] = key.split(
          "::"
        );
        const ship_type_id = Number(ship_type_id_raw);

        // Pick one sample row for this section to read title & order
        const sampleRow = rows.find(
          (r) =>
            r.ship_type_id === ship_type_id &&
            r.cadet_category === cadet_category &&
            r.section_code === section_code
        ) as FamStructureRow;

        let section = await FamiliarisationSectionTemplate.findOne({
          where: { ship_type_id, cadet_category, section_code },
        });

        if (!section) {
          // Section does NOT exist -> always create
          section = await FamiliarisationSectionTemplate.create({
            ship_type_id,
            cadet_category,
            section_code,
            title: sampleRow.section_title,
            order_number: sampleRow.section_order,
          });
        } else {
          // Section exists -> behaviour depends on strategy
          if (
            conflictStrategy === "UPDATE" ||
            conflictStrategy === "OVERWRITE"
          ) {
            await section.update({
              title: sampleRow.section_title,
              order_number: sampleRow.section_order,
            });
          }

          if (conflictStrategy === "OVERWRITE") {
            sectionsNeedingOverwrite.add(section.getDataValue("id"));
          }
        }

        sectionKeyToId[key] = section.getDataValue("id");
      }

      // 5) If OVERWRITE -> delete all existing tasks for affected sections
      if (sectionsNeedingOverwrite.size > 0) {
        await FamiliarisationTaskTemplate.destroy({
          where: {
            section_template_id: Array.from(sectionsNeedingOverwrite),
          },
        });
      }

      // 6) Build list of tasks to create from ALL rows
      const tasksToCreate = rows.map((row) => {
        const key = `${row.ship_type_id}::${row.cadet_category}::${row.section_code}`;
        const sectionId = sectionKeyToId[key];

        return {
          section_template_id: sectionId,
          cadet_category: row.cadet_category,
          task_code: row.task_code,
          task_description: row.task_description,
          order_number: row.task_order,
          is_mandatory:
            typeof row.is_mandatory === "boolean" ? row.is_mandatory : true,
        };
      });

      const createdTasks = await FamiliarisationTaskTemplate.bulkCreate(
        tasksToCreate
      );

      return res.status(201).json({
        message: "Familiarisation structure imported",
        conflictStrategy,
        sectionsAffected: Object.keys(sectionKeyToId).length,
        tasksCreated: createdTasks.length,
      });
    } catch (err) {
      console.error("Bulk fam structure import error:", err);
      return res.status(500).json({
        message: "Unable to import familiarisation structure",
      });
    }
  }
);

export default router;
