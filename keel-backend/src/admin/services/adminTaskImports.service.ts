// keel-backend/src/admin/services/adminTaskImports.service.ts
import ExcelJS from "exceljs";
import sequelize from "../../config/database.js";
import ShipType from "../../models/ShipType.js";
import FamiliarisationSectionTemplate from "../../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../../models/FamiliarisationTaskTemplate.js";

/* ======================================================================
 * TEMPLATE GENERATION
 * ====================================================================== */
export async function buildTaskImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tasks");

  // Columns: Department, Ship Type, Section, Code, Description, Mandatory?
  sheet.columns = [
    { header: "department", key: "department", width: 15 },
    { header: "ship_type", key: "ship_type", width: 20 },
    { header: "section_name", key: "section_name", width: 25 },
    { header: "task_code", key: "task_code", width: 10 },
    { header: "description", key: "description", width: 50 },
    { header: "is_mandatory", key: "is_mandatory", width: 12 },
  ];

  // Example Row
  sheet.addRow({
    department: "DECK",
    ship_type: "Oil Tanker",
    section_name: "Cargo Operations",
    task_code: "C.1",
    description: "Check inert gas system pressure",
    is_mandatory: "Yes",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

/* ======================================================================
 * PREVIEW
 * ====================================================================== */
export async function previewTaskImportXlsx(file: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file);
  const sheet = workbook.worksheets[0];
  
  if (!sheet) throw new Error("No sheet found");

  const rows: any[] = [];
  
  sheet.eachRow((row, index) => {
    if (index === 1) return; // Skip header

    const v = row.values as any[];
    // ExcelJS 1-based index
    const department = String(v[1] || "").trim().toUpperCase();
    const ship_type = String(v[2] || "").trim();
    const section_name = String(v[3] || "").trim();
    const task_code = String(v[4] || "").trim();
    const description = String(v[5] || "").trim();
    const is_mandatory_raw = String(v[6] || "").trim().toLowerCase();
    
    const is_mandatory = ["yes", "true", "1", "y"].includes(is_mandatory_raw);

    const issues: string[] = [];
    if (!department) issues.push("Missing Department");
    if (!ship_type) issues.push("Missing Ship Type");
    if (!section_name) issues.push("Missing Section Name");
    if (!description) issues.push("Missing Description");

    rows.push({
      row_number: index,
      status: issues.length ? "FAIL" : "READY",
      issues,
      data: {
        department,
        ship_type,
        section_name,
        task_code,
        description,
        is_mandatory
      }
    });
  });

  // Calculate Summary
  const summary = {
    total: rows.length,
    ready: rows.filter(r => r.status === "READY").length,
    fail: rows.filter(r => r.status === "FAIL").length,
  };

  return { summary, rows };
}

/* ======================================================================
 * COMMIT
 * ====================================================================== */
export async function commitTaskImportXlsx(file: Buffer) {
  const preview = await previewTaskImportXlsx(file);
  if (preview.summary.ready === 0) {
    throw new Error("No valid rows to import");
  }

  let createdCount = 0;

  // Use transaction to ensure integrity
  await sequelize.transaction(async (tx) => {
    for (const row of preview.rows) {
      if (row.status !== "READY") continue;

      const { department, ship_type, section_name, task_code, description, is_mandatory } = row.data;

      // 1. Find or Create Ship Type
      let shipType = await ShipType.findOne({ where: { name: ship_type }, transaction: tx });
      
      if (!shipType) {
        const typeCode = ship_type.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 20);
        shipType = await ShipType.create({ name: ship_type, type_code: typeCode }, { transaction: tx });
      }

      // 2. Find or Create Section (Linked to Ship Type)
      let section = await FamiliarisationSectionTemplate.findOne({
        where: { name: section_name, ship_type_id: shipType.id },
        transaction: tx
      });

      if (!section) {
        const count = await FamiliarisationSectionTemplate.count({ where: { ship_type_id: shipType.id }, transaction: tx });
        section = await FamiliarisationSectionTemplate.create({
          ship_type_id: shipType.id,
          name: section_name,
          order_number: count + 1,
        }, { transaction: tx });
      }

      // 3. Create Task
      const taskCount = await FamiliarisationTaskTemplate.count({ where: { section_template_id: section.id }, transaction: tx });
      
      await FamiliarisationTaskTemplate.create({
        section_template_id: section.id,
        cadet_category: department,
        task_code: task_code || T-,
        task_description: description,
        order_number: taskCount + 1,
        is_mandatory
      }, { transaction: tx });

      createdCount++;
    }
  });

  return { 
    success: true, 
    message: Imported  tasks successfully,
    created: createdCount 
  };
}
