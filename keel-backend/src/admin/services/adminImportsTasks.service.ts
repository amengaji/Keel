import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { ShipType } from "../../models/index.js";

/* ======================================================================
 * TYPES
 * ====================================================================== */

export type TaskImportPreviewRowStatus =
  | "READY"
  | "READY_WITH_WARNINGS"
  | "SKIP"
  | "FAIL";

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
    department: string | null; // <--- ADDED
  };
  derived: {
    ship_type_id: number | null;
  };
  issues: string[];
};

export type TaskImportPreviewResult = {
  summary: {
    total: number;
    ready: number;
    ready_with_warnings: number;
    skip: number;
    fail: number;
  };
  rows: TaskImportPreviewRow[];
  notes: string[];
};

const ALLOWED_COLUMNS = [
  "part_number",
  "section_name",
  "title",
  "description",
  "stcw_reference",
  "mandatory_for_all",
  "ship_type",
  "department", // <--- ADDED
] as const;

type AllowedColumn = (typeof ALLOWED_COLUMNS)[number];
const REQUIRED_COLUMNS: AllowedColumn[] = ["part_number", "title"];

/* ======================================================================
 * HELPERS
 * ====================================================================== */

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeText(v: any): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
}

function normalizeBool(v: any): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["true", "yes", "y", "1"].includes(s);
}

function normalizeInt(v: any): number | null {
  if (v === undefined || v === null) return null;
  const n = parseInt(String(v).trim(), 10);
  return isNaN(n) ? null : n;
}

/* ======================================================================
 * TEMPLATE GENERATION
 * ====================================================================== */

export async function buildTaskImportTemplateXlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tasks");

  sheet.columns = [
    { header: "part_number", key: "part_number", width: 15 },
    { header: "section_name", key: "section_name", width: 25 },
    { header: "title", key: "title", width: 40 },
    { header: "description", key: "description", width: 40 },
    { header: "stcw_reference", key: "stcw_reference", width: 20 },
    { header: "mandatory_for_all", key: "mandatory_for_all", width: 15 },
    { header: "ship_type", key: "ship_type", width: 25 },
    { header: "department", key: "department", width: 20 }, // <--- ADDED
  ];

  // Example Row
  sheet.addRow({
    part_number: 1,
    section_name: "Navigation",
    title: "Determine position using terrestrial observations",
    description: "Use cross bearings to fix position on chart.",
    stcw_reference: "A-II/1",
    mandatory_for_all: "TRUE",
    ship_type: "", 
    department: "Deck", // <--- ADDED
  });

  // 1. Department Dropdown
  // Apply to column H (Department), rows 2-1000
  for (let i = 2; i <= 1000; i++) {
    sheet.getCell(`H${i}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Deck,Engine,Electrical,Catering,General"'],
      showErrorMessage: true,
      errorTitle: "Invalid Department",
      error: "Please select from: Deck, Engine, Electrical, Catering, General",
    };
  }

  // 2. Ship Types Dropdown (Dynamic)
  const shipTypes = await ShipType.findAll({ attributes: ["name"] });
  const shipTypeNames = shipTypes.map((st) => st.name);

  if (shipTypeNames.length > 0) {
    const metaSheet = workbook.addWorksheet("_meta", { state: "hidden" });
    shipTypeNames.forEach((name, idx) => {
      metaSheet.getCell(`A${idx + 1}`).value = name;
    });
    const listRef = `_meta!$A$1:$A$${shipTypeNames.length}`;
    
    // Apply to column G (Ship Type)
    for (let i = 2; i <= 1000; i++) {
      sheet.getCell(`G${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [listRef],
        showErrorMessage: true,
        errorTitle: "Invalid Ship Type",
        error: "Select a valid Ship Type or leave blank for Universal.",
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

/* ======================================================================
 * PREVIEW LOGIC
 * ====================================================================== */

export async function previewTaskImportXlsx(
  buffer: Buffer
): Promise<TaskImportPreviewResult> {
  const notes: string[] = [];
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

  if (!aoa || aoa.length === 0) {
    return { summary: emptySummary(), rows: [], notes: ["Excel file empty."] };
  }

  const headersNormalized = aoa[0].map(normalizeHeader);

  // Validate headers
  for (const req of REQUIRED_COLUMNS) {
    if (!headersNormalized.includes(req)) {
      throw new Error(`Missing required column: "${req}"`);
    }
  }

  const shipTypes = await ShipType.findAll();
  const shipTypeMap = new Map<string, number>();
  shipTypes.forEach((st) => shipTypeMap.set(st.name.toLowerCase(), st.id));

  const dataRows = aoa.slice(1);
  const rows: TaskImportPreviewRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i] ?? [];
    const get = (col: AllowedColumn) => {
      const idx = headersNormalized.indexOf(col);
      return idx === -1 ? null : raw[idx];
    };

    const part_number = normalizeInt(get("part_number"));
    const section_name = normalizeText(get("section_name"));
    const title = normalizeText(get("title"));
    const description = normalizeText(get("description"));
    const stcw_reference = normalizeText(get("stcw_reference"));
    const mandatory_for_all = normalizeBool(get("mandatory_for_all"));
    const ship_type_name = normalizeText(get("ship_type"));
    
    // Normalize Department
    let department = normalizeText(get("department"));
    if (department) {
      // Capitalize first letter to match Enum style
      department = department.charAt(0).toUpperCase() + department.slice(1).toLowerCase();
      const validDepts = ["Deck", "Engine", "Electrical", "Catering", "General"];
      if (!validDepts.includes(department)) {
         // Fallback or warning? Let's default to General but warn
         department = "General";
      }
    } else {
      department = "General";
    }

    const issues: string[] = [];
    if (!part_number) issues.push("part_number is required");
    if (!title) issues.push("title is required");

    let ship_type_id: number | null = null;
    if (ship_type_name) {
      const foundId = shipTypeMap.get(ship_type_name.toLowerCase());
      if (foundId) {
        ship_type_id = foundId;
      } else {
        issues.push(`Unknown ship type: "${ship_type_name}"`);
      }
    }

    let status: TaskImportPreviewRowStatus = issues.length > 0 ? "FAIL" : "READY";

    rows.push({
      row_number: i + 2,
      status,
      input: Object.fromEntries(ALLOWED_COLUMNS.map((c) => [c, get(c)])),
      normalized: {
        part_number,
        section_name,
        title,
        description,
        stcw_reference,
        mandatory_for_all,
        ship_type_name,
        department, // <--- PASSED THROUGH
      },
      derived: { ship_type_id },
      issues,
    });
  }

  return {
    summary: {
      total: rows.length,
      ready: rows.filter((r) => r.status === "READY").length,
      ready_with_warnings: 0,
      skip: rows.filter((r) => r.status === "SKIP").length,
      fail: rows.filter((r) => r.status === "FAIL").length,
    },
    rows,
    notes,
  };
}

function emptySummary() {
  return { total: 0, ready: 0, ready_with_warnings: 0, skip: 0, fail: 0 };
}
