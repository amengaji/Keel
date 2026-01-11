// keel-backend/src/admin/services/adminImports.service.ts

import * as XLSX from "xlsx"; // Still used for reading/preview
import ExcelJS from "exceljs"; // Used for writing template (better validation support)
import sequelize from "../../config/database.js";

export type TraineeType =
  | "DECK_CADET"
  | "ENGINE_CADET"
  | "ETO_CADET"
  | "DECK_RATING"
  | "ENGINE_RATING";

const TRAINEE_DERIVATION: Record<
  TraineeType,
  { rank_label: string; category: "Cadet" | "Rating"; trb_applicable: boolean }
> = {
  DECK_CADET: { rank_label: "Deck Cadet", category: "Cadet", trb_applicable: true },
  ENGINE_CADET: { rank_label: "Engine Cadet", category: "Cadet", trb_applicable: true },
  ETO_CADET: { rank_label: "ETO Cadet", category: "Cadet", trb_applicable: true },
  DECK_RATING: { rank_label: "Deck Rating", category: "Rating", trb_applicable: false },
  ENGINE_RATING: { rank_label: "Engine Rating", category: "Rating", trb_applicable: false },
};

export type CadetImportPreviewRowStatus =
  | "READY"
  | "READY_WITH_WARNINGS"
  | "SKIP"
  | "FAIL";

export type CadetImportPreviewRow = {
  row_number: number;
  status: CadetImportPreviewRowStatus;
  input: Record<string, any>;
  normalized: {
    full_name: string | null;
    email: string | null;
    trainee_type: TraineeType | null;
    nationality: string | null;
    notes: string | null;
    rank_label: string | null;
    category: string | null;
    trb_applicable: boolean | null;
  };
  derived: {
    rank_label: string | null;
    category: string | null;
    trb_applicable: boolean | null;
  };
  issues: string[];
};

export type CadetImportPreviewResult = {
  summary: { total: number; ready: number; ready_with_warnings: number; skip: number; fail: number };
  rows: CadetImportPreviewRow[];
  notes: string[];
};

const ALLOWED_COLUMNS = [
  "full_name",
  "email",
  "trainee_type",
  "nationality",
  "notes",
  "rank_label",
  "category",
  "trb_applicable",
] as const;

type AllowedColumn = (typeof ALLOWED_COLUMNS)[number];

const REQUIRED_COLUMNS: AllowedColumn[] = ["full_name", "email", "trainee_type"];

/* ... Helpers (Keep existing ones) ... */
function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function normalizeText(v: any): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
}
function normalizeBool(v: any): boolean | null {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return null;
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
async function findExistingEmailsLower(emailsLower: string[]): Promise<Set<string>> {
  if (emailsLower.length === 0) return new Set();
  const [rows] = await sequelize.query(
    `SELECT LOWER(email) AS email_lower FROM users WHERE LOWER(email) IN (:emailsLower)`,
    { replacements: { emailsLower } }
  );
  const set = new Set<string>();
  for (const r of rows as any[]) {
    if (r?.email_lower) set.add(String(r.email_lower));
  }
  return set;
}
function normalizeProperCase(v: any): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim().replace(/\s+/g, " ");
  if (!t.length) return null;
  return t.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* ======================================================================
 * TEMPLATE GENERATION (UPDATED: Uses ExcelJS for Dropdowns)
 * ====================================================================== */

export async function buildCadetImportTemplateXlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // 1. MAIN SHEET
  const sheet = workbook.addWorksheet("Cadets");

  sheet.columns = [
    { header: "full_name", key: "full_name", width: 25 },
    { header: "email", key: "email", width: 30 },
    { header: "trainee_type", key: "trainee_type", width: 25 },
    { header: "nationality", key: "nationality", width: 20 },
    { header: "notes", key: "notes", width: 30 },
    { header: "rank_label", key: "rank_label", width: 20 },
    { header: "category", key: "category", width: 15 },
    { header: "trb_applicable", key: "trb_applicable", width: 15 },
  ];

  sheet.addRow({
    full_name: "Anuj Mengaji",
    email: "anuj@example.com",
    trainee_type: "", // Blank to force selection
    nationality: "Indian",
    notes: "Onboarded via batch import",
    rank_label: "",
    category: "",
    trb_applicable: "",
  });

  // 2. META SHEET (Hidden List)
  const metaSheet = workbook.addWorksheet("_meta", { state: "hidden" });
  const traineeTypes = Object.keys(TRAINEE_DERIVATION);

  traineeTypes.forEach((type, index) => {
    metaSheet.getCell(`A${index + 1}`).value = type;
  });

  // 3. DATA VALIDATION
  const listRef = `_meta!$A$1:$A$${traineeTypes.length}`;

  for (let i = 2; i <= 1000; i++) {
    const cell = sheet.getCell(`C${i}`);
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [listRef],
      showErrorMessage: true,
      errorTitle: "Invalid Selection",
      error: "Please select a valid Trainee Type from the dropdown.",
    };
  }

  // 4. WRITE & RETURN (ASYNC)
  const buffer = await workbook.xlsx.writeBuffer();
  // Safe cast for strict TS configs that see ArrayBuffer
  return buffer as unknown as Buffer;
}

/* ======================================================================
 * PREVIEW (Keep Existing)
 * ====================================================================== */

export async function previewCadetImportXlsx(buffer: Buffer): Promise<CadetImportPreviewResult> {
  const notes: string[] = [];

  const wb = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = wb.SheetNames?.[0];

  if (!firstSheetName) {
    return {
      summary: { total: 0, ready: 0, ready_with_warnings: 0, skip: 0, fail: 0 },
      rows: [],
      notes: ["Excel file has no sheets."],
    };
  }

  const ws = wb.Sheets[firstSheetName];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

  if (!aoa || aoa.length === 0) {
    return {
      summary: { total: 0, ready: 0, ready_with_warnings: 0, skip: 0, fail: 0 },
      rows: [],
      notes: ["No rows found in the first sheet."],
    };
  }

  const rawHeaderRow = aoa[0];
  const headersNormalized = rawHeaderRow.map(normalizeHeader);

  const hasAnyHeader = headersNormalized.some((h) => h.length > 0);
  if (!hasAnyHeader) {
    return {
      summary: { total: 0, ready: 0, ready_with_warnings: 0, skip: 0, fail: 0 },
      rows: [],
      notes: [
        "No header row detected (Row 1 is empty).",
        `Required headers: ${REQUIRED_COLUMNS.join(", ")}`,
        `Allowed headers: ${ALLOWED_COLUMNS.join(", ")}`,
      ],
    };
  }

  const allowed = new Set<string>(ALLOWED_COLUMNS);
  for (const h of headersNormalized) {
    if (!h) continue;
    if (!allowed.has(h)) {
      throw new Error(
        `Unexpected column "${h}". Allowed columns: ${ALLOWED_COLUMNS.join(", ")}`
      );
    }
  }

  for (const req of REQUIRED_COLUMNS) {
    if (!headersNormalized.includes(req)) {
      throw new Error(`Missing required column "${req}".`);
    }
  }

  const dataRows = aoa.slice(1);
  if (dataRows.length === 0) {
    return {
      summary: { total: 0, ready: 0, ready_with_warnings: 0, skip: 0, fail: 0 },
      rows: [],
      notes: ["No data rows found in the first sheet."],
    };
  }

  const rows: CadetImportPreviewRow[] = [];
  const emailsLower: string[] = [];
  for (const r of dataRows) {
    const idxEmail = headersNormalized.indexOf("email");
    const email = normalizeText(r?.[idxEmail]);
    if (email) emailsLower.push(email.toLowerCase());
  }

  const existingEmailSet = await findExistingEmailsLower([...new Set(emailsLower)]);

  for (let i = 0; i < dataRows.length; i++) {
    const excelRowNumber = i + 2; 
    const raw = dataRows[i] ?? [];

    const get = (col: AllowedColumn) => {
      const idx = headersNormalized.indexOf(col);
      if (idx === -1) return null;
      return raw[idx];
    };

    const full_name = normalizeText(get("full_name"));
    const email = normalizeText(get("email"));
    const trainee_type_raw = normalizeText(get("trainee_type"));
    const nationality = normalizeProperCase(get("nationality"));
    const notesText = normalizeText(get("notes"));
    const rank_label_override = normalizeText(get("rank_label"));
    const category_override = normalizeText(get("category"));
    const trb_applicable_override = normalizeBool(get("trb_applicable"));

    const issues: string[] = [];

    if (!full_name) issues.push("full_name is required");
    if (!email) issues.push("email is required");
    if (email && !isValidEmail(email)) issues.push("email is invalid format");
    if (!trainee_type_raw) issues.push("trainee_type is required");

    const trainee_type = (trainee_type_raw as TraineeType) ?? null;
    if (trainee_type_raw && !(trainee_type_raw in TRAINEE_DERIVATION)) {
      issues.push(
        `trainee_type must be one of: ${Object.keys(TRAINEE_DERIVATION).join(", ")}`
      );
    }

    const derived =
      trainee_type_raw && (trainee_type_raw in TRAINEE_DERIVATION)
        ? TRAINEE_DERIVATION[trainee_type_raw as TraineeType]
        : null;

    const emailLower = email ? email.toLowerCase() : null;
    const alreadyExists = emailLower ? existingEmailSet.has(emailLower) : false;

    let status: CadetImportPreviewRowStatus = "READY";

    if (issues.length > 0) {
      status = "FAIL";
    } else if (alreadyExists) {
      status = "SKIP";
      issues.push("email already exists (row will be skipped)");
    } else {
      const warnings: string[] = [];
      if (derived) {
        if (rank_label_override && rank_label_override !== derived.rank_label) {
          warnings.push(`rank_label overridden: expected "${derived.rank_label}"`);
        }
        if (category_override && category_override !== derived.category) {
          warnings.push(`category overridden: expected "${derived.category}"`);
        }
        if (
          trb_applicable_override !== null &&
          trb_applicable_override !== derived.trb_applicable
        ) {
          warnings.push(`trb_applicable overridden: expected ${derived.trb_applicable}`);
        }
      }
      if (warnings.length) {
        status = "READY_WITH_WARNINGS";
        issues.push(...warnings);
      }
    }

    rows.push({
      row_number: excelRowNumber,
      status,
      input: Object.fromEntries(
        ALLOWED_COLUMNS.map((c) => [c, get(c)])
      ),
      normalized: {
        full_name,
        email,
        trainee_type: trainee_type_raw && (trainee_type_raw in TRAINEE_DERIVATION) ? (trainee_type_raw as TraineeType) : null,
        nationality,
        notes: notesText,
        rank_label: rank_label_override,
        category: category_override,
        trb_applicable: trb_applicable_override,
      },
      derived: {
        rank_label: derived?.rank_label ?? null,
        category: derived?.category ?? null,
        trb_applicable: derived?.trb_applicable ?? null,
      },
      issues,
    });
  }

  const summary = {
    total: rows.length,
    ready: rows.filter((r) => r.status === "READY").length,
    ready_with_warnings: rows.filter((r) => r.status === "READY_WITH_WARNINGS").length,
    skip: rows.filter((r) => r.status === "SKIP").length,
    fail: rows.filter((r) => r.status === "FAIL").length,
  };

  if (summary.fail > 0) notes.push("Some rows failed validation. Fix and re-upload.");
  if (summary.ready_with_warnings > 0) notes.push("Some rows have warnings (overrides differ from derived values).");

  return { summary, rows, notes };
}