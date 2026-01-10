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
import sequelize from "../../config/database.js";
import Vessel from "../../models/Vessel.js";
import ShipType from "../../models/ShipType.js";

/* ======================================================================
 * TEMPLATE GENERATION
 * ====================================================================== */

/**
 * Builds an Excel template for vessel import.
 */
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

  // ✅ CRITICAL FIX
  const uint8 = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8);


}

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

type ExcelBinary = Buffer | Uint8Array | ArrayBuffer;

export async function previewVesselImportXlsx(file: ExcelBinary) {
  const workbook = new ExcelJS.Workbook();
  const nodeBuffer = Buffer.isBuffer(file)
  ? file
  : Buffer.from(file as any);

  await workbook.xlsx.load(nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength));


  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel file has no sheets");

  const rows: any[] = [];

  sheet.eachRow((row, index) => {
    if (index === 1) return;

    const [
      imo_number,
      vessel_name,
      vessel_type,
      flag_state,
      class_society,
    ] = row.values as any[];

    rows.push({
      imo_number: String(imo_number || "").trim(),
      vessel_name: String(vessel_name || "").trim(),
      vessel_type: String(vessel_type || "").trim(),
      flag_state: String(flag_state || "").trim(),
      class_society: String(class_society || "").trim(),
    });
  });

  return {
    total: rows.length,
    rows,
  };
}

/* ======================================================================
 * COMMIT (POLICY B)
 * ====================================================================== */

export async function commitVesselImportXlsx(file: ExcelBinary) {
  const preview = await previewVesselImportXlsx(file);

  if (preview.total === 0) {
    return {
      created: 0,
      skipped: 0,
      message: "No rows found in import file",
    };
  }

  let created = 0;
  let skipped = 0;

  await sequelize.transaction(async (tx) => {
    for (const row of preview.rows) {
      if (!row.imo_number || !row.vessel_name || !row.vessel_type) {
        skipped++;
        continue;
      }

      const existing = await Vessel.findOne({
        where: { imo_number: row.imo_number },
        transaction: tx,
      });

      if (existing) {
        skipped++;
        continue;
      }

      const shipType = await ShipType.findOne({
        where: { name: row.vessel_type },
        transaction: tx,
      });

      if (!shipType) {
        skipped++;
        continue;
      }

      await Vessel.create(
        {
          imo_number: row.imo_number,
          vessel_name: row.vessel_name,
          ship_type_id: shipType.getDataValue("id"),
          flag: row.flag_state || null,
          classification_society: row.class_society || null,
        },
        { transaction: tx }
      );

      created++;
    }
  });

  return {
    created,
    skipped,
    message:
      created === 0
        ? "No new vessels created (all rows skipped)"
        : `${created} vessels created successfully`,
  };
}
