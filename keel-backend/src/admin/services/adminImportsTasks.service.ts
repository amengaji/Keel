import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { ShipType } from "../../models/index.js";

export type TaskImportPreviewRowStatus = "READY" | "READY_WITH_WARNINGS" | "SKIP" | "FAIL";

export type TaskImportPreviewRow = {
  row_number: number;
  status: TaskImportPreviewRowStatus;
  input: Record<string, any>;
  normalized: {
    part_number: number | null;
    section_name: string | null;
    title: string | null;
    description: string | null;
    stcw_reference: string | null;
    mandatory_for_all: boolean;
    ship_type_name: string | null;
    department: string | null;
    trainee_type: string | null;
    instructions: string | null;
    safety_requirements: string | null;
    evidence_type: string | null;
    verification_method: string | null;
    frequency: string | null;
  };
  derived: {
    ship_type_id: number | null;
  };
  issues: string[];
};

export type TaskImportPreviewResult = {
  summary: { total: number; ready: number; ready_with_warnings: number; skip: number; fail: number };
  rows: TaskImportPreviewRow[];
  notes: string[];
};

const ALLOWED_COLUMNS = [
  "part_number", "section_name", "title", "description", "stcw_reference", 
  "mandatory_for_all", "ship_type", "department", "trainee_type",
  "instructions", "safety_requirements", "evidence_type", "verification_method", "frequency"
] as const;

type AllowedColumn = (typeof ALLOWED_COLUMNS)[number];
const REQUIRED_COLUMNS: AllowedColumn[] = ["part_number", "title"];

// --- HELPERS ---
function normalizeHeader(h: unknown): string { return String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_"); }
function normalizeText(v: any): string | null { if (!v) return null; const t = String(v).trim(); return t.length ? t : null; }
function normalizeBool(v: any): boolean { if (!v) return false; return ["true", "yes", "y", "1"].includes(String(v).trim().toLowerCase()); }
function normalizeInt(v: any): number | null { if (!v) return null; const n = parseInt(String(v).trim(), 10); return isNaN(n) ? null : n; }

// --- TEMPLATE GENERATOR ---
export async function buildTaskImportTemplateXlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tasks");

  sheet.columns = [
    { header: "part_number", key: "part_number", width: 10 },
    { header: "section_name", key: "section_name", width: 20 },
    { header: "title", key: "title", width: 40 },
    { header: "description", key: "description", width: 30 },
    { header: "stcw_reference", key: "stcw_reference", width: 15 },
    { header: "mandatory_for_all", key: "mandatory_for_all", width: 15 },
    { header: "ship_type", key: "ship_type", width: 20 },
    { header: "department", key: "department", width: 15 },
    { header: "trainee_type", key: "trainee_type", width: 20 }, // <--- TARGET COLUMN
    { header: "instructions", key: "instructions", width: 40 },
    { header: "safety_requirements", key: "safety_requirements", width: 30 },
    { header: "evidence_type", key: "evidence_type", width: 20 },
    { header: "verification_method", key: "verification_method", width: 20 },
    { header: "frequency", key: "frequency", width: 15 },
  ];

  // Example Row
  sheet.addRow({
    part_number: 1, section_name: "Navigation", title: "Visual Bearings", description: "Use azimuth circle",
    stcw_reference: "A-II/1", mandatory_for_all: "TRUE", ship_type: "", department: "Deck",
    trainee_type: "DECK_CADET", // Example using CORRECT Enum
    instructions: "Standard bridge procedure.", safety_requirements: "None",
    evidence_type: "PHOTO", verification_method: "OBSERVATION", frequency: "ONCE"
  });

  // Data Validations
  for (let i = 2; i <= 1000; i++) {
    // Department
    sheet.getCell(`H${i}`).dataValidation = { type: "list", formulae: ['"Deck,Engine,Electrical,Catering,General"'] };
    
    // Trainee Type (STRICT ENUMS)
    sheet.getCell(`I${i}`).dataValidation = { 
      type: "list", 
      formulae: ['"DECK_CADET,ENGINE_CADET,ETO_CADET,DECK_RATING,ENGINE_RATING"'],
      showErrorMessage: true,
      errorTitle: "Invalid Trainee Type",
      error: "Must be: DECK_CADET, ENGINE_CADET, ETO_CADET, DECK_RATING, or ENGINE_RATING"
    };

    sheet.getCell(`L${i}`).dataValidation = { type: "list", formulae: ['"PHOTO,VIDEO,DOCUMENT,NONE"'] }; 
    sheet.getCell(`M${i}`).dataValidation = { type: "list", formulae: ['"OBSERVATION,Q&A,SIMULATION,CHECKLIST"'] }; 
    sheet.getCell(`N${i}`).dataValidation = { type: "list", formulae: ['"ONCE,MONTHLY,QUARTERLY"'] }; 
  }

  // Ship Types Dynamic Dropdown
  const shipTypes = await ShipType.findAll({ attributes: ["name"] });
  if (shipTypes.length > 0) {
    const metaSheet = workbook.addWorksheet("_meta", { state: "hidden" });
    shipTypes.forEach((st, idx) => { metaSheet.getCell(`A${idx + 1}`).value = st.name; });
    const listRef = `_meta!$A$1:$A$${shipTypes.length}`;
    for (let i = 2; i <= 1000; i++) {
      sheet.getCell(`G${i}`).dataValidation = { type: "list", formulae: [listRef], allowBlank: true };
    }
  }

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
}

// --- PARSER ---
export async function previewTaskImportXlsx(buffer: Buffer): Promise<TaskImportPreviewResult> {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const aoa: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
  
  if (!aoa || aoa.length === 0) return { summary: { total:0, ready:0, ready_with_warnings:0, skip:0, fail:0 }, rows: [], notes: ["Empty file"] };

  const headers = aoa[0].map(normalizeHeader);
  for (const req of REQUIRED_COLUMNS) if (!headers.includes(req)) throw new Error(`Missing: ${req}`);

  const shipTypes = await ShipType.findAll();
  const shipMap = new Map<string, number>();
  shipTypes.forEach((st) => shipMap.set(st.name.toLowerCase(), st.id));

  const rows: TaskImportPreviewRow[] = [];
  const dataRows = aoa.slice(1);

  // VALID ENUMS
  const VALID_TRAINEE_TYPES = ["DECK_CADET", "ENGINE_CADET", "ETO_CADET", "DECK_RATING", "ENGINE_RATING"];

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i] ?? [];
    const get = (c: AllowedColumn) => { const idx = headers.indexOf(c); return idx === -1 ? null : raw[idx]; };

    const dept = normalizeText(get("department")) || "General";
    
    // Normalize Trainee Type
    let tType = normalizeText(get("trainee_type"));
    if (tType) tType = tType.toUpperCase().replace(/\s+/g, "_"); // Auto-fix "Deck Cadet" -> "DECK_CADET"
    
    const issues: string[] = [];

    // Validation
    if (tType && !VALID_TRAINEE_TYPES.includes(tType)) {
      issues.push(`Invalid Trainee Type: ${tType}`);
    }
    if (!tType) tType = "DECK_CADET"; // Default safe fallback if missing

    const shipName = normalizeText(get("ship_type"));
    let shipId = null;

    if (shipName) {
      if (shipMap.has(shipName.toLowerCase())) shipId = shipMap.get(shipName.toLowerCase())!;
      else issues.push(`Unknown ship type: ${shipName}`);
    }

    rows.push({
      row_number: i + 2,
      status: issues.length > 0 ? "FAIL" : "READY",
      input: Object.fromEntries(ALLOWED_COLUMNS.map(c => [c, get(c)])),
      normalized: {
        part_number: normalizeInt(get("part_number")),
        section_name: normalizeText(get("section_name")),
        title: normalizeText(get("title")),
        description: normalizeText(get("description")),
        stcw_reference: normalizeText(get("stcw_reference")),
        mandatory_for_all: normalizeBool(get("mandatory_for_all")),
        ship_type_name: shipName,
        department: dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase(),
        trainee_type: tType, 
        instructions: normalizeText(get("instructions")),
        safety_requirements: normalizeText(get("safety_requirements")),
        evidence_type: normalizeText(get("evidence_type")) || "NONE",
        verification_method: normalizeText(get("verification_method")) || "OBSERVATION",
        frequency: normalizeText(get("frequency")) || "ONCE",
      },
      derived: { ship_type_id: shipId },
      issues
    });
  }

  return {
    summary: {
      total: rows.length,
      ready: rows.filter(r => r.status === "READY").length,
      ready_with_warnings: 0,
      skip: 0,
      fail: rows.filter(r => r.status === "FAIL").length
    },
    rows,
    notes: []
  };
}
