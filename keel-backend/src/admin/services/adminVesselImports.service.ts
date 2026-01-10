// keel-backend/src/admin/services/adminVesselImports.service.ts
//
// PURPOSE:
// - Vessel Excel Import (Admin)
// - Template generation
// - Preview (NO WRITES)
// - Commit (Policy B: success no-op if nothing to create)
//
// SAFETY:
// - Transactional
// - Audit-safe
// - IMO is immutable identity
//

import ExcelJS from "exceljs";
import { Op } from "sequelize"; // Need Op for bulk checks
import sequelize from "../../config/database.js";
import Vessel from "../../models/Vessel.js";
import ShipType from "../../models/ShipType.js";

/* ======================================================================
 * TEMPLATE GENERATION
 * ====================================================================== */

export async function buildVesselImportTemplateXlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Vessels");

  sheet.columns = [
    { header: "imo_number", key: "imo_number", width: 18 },
    { header: "vessel_name", key: "vessel_name", width: 28 },
    { header: "vessel_type", key: "vessel_type", width: 24 },
    { header: "flag_state", key: "flag_state", width: 20 },
    { header: "class_society", key: "class_society", width: 28 },
  ];

  sheet.addRow({
    imo_number: "IMO 9876543",
    vessel_name: "MV Ocean Pioneer",
    vessel_type: "Bulk Carrier",
    flag_state: "Panama",
    class_society: "DNV",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

type ExcelBinary = Buffer | Uint8Array | ArrayBuffer;

export async function previewVesselImportXlsx(file: ExcelBinary) {
  const workbook = new ExcelJS.Workbook();
  const nodeBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file as any);
  await workbook.xlsx.load(nodeBuffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel file has no sheets");

  const rows: any[] = [];
  const imoList: string[] = [];

  // 1. PARSE STEP
  sheet.eachRow((row, index) => {
    if (index === 1) return; // Skip header

    const values = row.values as any[];
    // ExcelJS 1-based index (index 0 is empty)
    const raw_imo = values[1]; 
    const vessel_name_val = values[2];
    const vessel_type_val = values[3];
    const flag_state_val = values[4];
    const class_society_val = values[5];

    // Sanitize IMO
    let imo_number = String(raw_imo || "").trim();
    imo_number = imo_number.replace(/^IMO\s*/i, "");

    const vessel_name = String(vessel_name_val || "").trim();
    const vessel_type = String(vessel_type_val || "").trim();
    
    // Collect valid IMOs for bulk DB check
    if (imo_number) {
        imoList.push(imo_number);
    }

    rows.push({
      row_number: index,
      status: "READY", // Will refine in Step 2
      issues: [],
      input: {
        imo_number, vessel_name, vessel_type, 
        flag_state: String(flag_state_val || "").trim(),
        class_society: String(class_society_val || "").trim()
      },
      normalized: {
        imo_number, vessel_name, vessel_type
      }
    });
  });

  // 2. DB CHECK STEP (The "Deep Preview")
  // Check which vessels already exist
  const existingVessels = await Vessel.findAll({
    where: { imo_number: { [Op.in]: imoList } },
    attributes: ["imo_number"]
  });
  const existingImos = new Set(existingVessels.map(v => v.imo_number));

  // 3. FINAL STATUS & SUMMARY
  let countReady = 0;
  let countReadyWarn = 0;
  let countSkip = 0;
  let countFail = 0;

  for (const row of rows) {
      const { imo_number, vessel_name, vessel_type } = row.input;

      // Basic Validation
      if (!imo_number) row.issues.push("Missing IMO Number");
      if (!vessel_name) row.issues.push("Missing Vessel Name");
      if (!vessel_type) row.issues.push("Missing Vessel Type");

      // Duplicate Check
      if (imo_number && existingImos.has(imo_number)) {
          row.status = "SKIP";
          row.issues.push("Vessel already exists in database");
      } else if (row.issues.length > 0) {
          row.status = "FAIL";
      }

      // Update Counts
      if (row.status === "FAIL") countFail++;
      else if (row.status === "SKIP") countSkip++;
      else if (row.status === "READY_WITH_WARNINGS") countReadyWarn++;
      else countReady++;
  }

  return {
    import_batch_id: `BATCH-${Date.now()}`,
    summary: {
        total: rows.length,
        ready: countReady,
        ready_with_warnings: countReadyWarn,
        skip: countSkip, // Now this will accurately reflect duplicates!
        fail: countFail
    },
    rows,
    notes: []
  };
}

/* ======================================================================
 * COMMIT (POLICY B)
 * ====================================================================== */

export async function commitVesselImportXlsx(file: ExcelBinary) {
  const preview = await previewVesselImportXlsx(file);

  if (preview.summary.total === 0) {
    return {
      summary: { created: 0, skipped: 0, fail: 0, total: 0 },
      results: [],
      notes: ["No rows found in import file"]
    };
  }

  let created = 0;
  let skipped = 0;
  let duplicateCount = 0;
  const results: any[] = [];

  await sequelize.transaction(async (tx) => {
    for (const row of preview.rows) {
      // Respect the preview status
      if (row.status === 'FAIL' || row.status === 'SKIP') {
        skipped++;
        if (row.issues.includes("Vessel already exists in database")) {
            duplicateCount++;
        }
        results.push({ ...row, commit_outcome: "SKIPPED" });
        continue;
      }

      // Double check inside transaction (race condition safety)
      const existing = await Vessel.findOne({
        where: { imo_number: row.normalized.imo_number },
        transaction: tx,
      });

      if (existing) {
        skipped++;
        duplicateCount++;
        results.push({ ...row, commit_outcome: "SKIPPED", issues: ["Vessel already exists"] });
        continue;
      }

      // Auto-create Ship Type if missing
      let shipType = await ShipType.findOne({
        where: { name: row.normalized.vessel_type },
        transaction: tx,
      });

      if (!shipType) {
        const typeCode = row.normalized.vessel_type
            .toUpperCase().replace(/[^A-Z0-9]/g, "_").substring(0, 20);
        shipType = await ShipType.create({
            name: row.normalized.vessel_type,
            type_code: typeCode,
            description: "Auto-created via Excel Import"
        }, { transaction: tx });
      }

      await Vessel.create(
        {
          imo_number: row.normalized.imo_number,
          name: row.input.vessel_name, 
          ship_type_id: shipType.getDataValue("id"),
          flag: row.input.flag_state || null,
          classification_society: row.input.class_society || null,
        },
        { transaction: tx }
      );

      created++;
      results.push({ ...row, commit_outcome: "CREATED" });
    }
  });

  // GENERATE USEFUL NOTES
  const notes = [];
  if (created > 0) notes.push(`${created} vessels created successfully.`);
  if (duplicateCount > 0) notes.push(`${duplicateCount} vessels skipped (already exist).`);
  if (skipped > duplicateCount) notes.push(`${skipped - duplicateCount} rows skipped due to errors.`);
  if (created === 0 && skipped > 0) notes.push("No changes made.");

  return {
    summary: {
        total: preview.summary.total,
        created,
        skipped,
        fail: preview.summary.fail,
        ready: 0,
        ready_with_warnings: 0
    },
    results,
    notes // Now contains clear reasons!
  };
}