import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import { User, Vessel, CadetVesselAssignment, Role } from "../../models/index.js";

/* ======================================================================
 * TYPES
 * ====================================================================== */

export type AssignImportRowStatus = "READY" | "SKIP" | "FAIL";

export type AssignImportPreviewRow = {
  row_number: number;
  status: AssignImportRowStatus;
  normalized: {
    email: string | null;
    vessel_imo: string | null;
    date_joined: string | null; // YYYY-MM-DD
    date_left: string | null;   // YYYY-MM-DD or null
    rank: string | null;
  };
  derived: {
    cadet_id: number | null;
    vessel_id: number | null;
  };
  issues: string[];
};

export type AssignImportPreviewResult = {
  summary: { total: number; ready: number; fail: number; skip: number };
  rows: AssignImportPreviewRow[];
  notes: string[];
};

/* ======================================================================
 * TEMPLATE
 * ====================================================================== */
export async function buildAssignmentImportTemplateXlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Assignments");

  sheet.columns = [
    { header: "cadet_email", key: "email", width: 30 },
    { header: "vessel_imo", key: "imo", width: 20 },
    { header: "date_joined", key: "joined", width: 15 },
    { header: "date_left", key: "left", width: 15 },
    { header: "rank", key: "rank", width: 20 },
  ];

  sheet.addRow({
    email: "cadet@keel.so",
    imo: "9123456",
    joined: "2023-01-01",
    left: "", // Blank = Active
    rank: "Deck Cadet",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

/* ======================================================================
 * PREVIEW
 * ====================================================================== */
export async function previewAssignmentImportXlsx(buffer: Buffer): Promise<AssignImportPreviewResult> {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

  if (!aoa || aoa.length <= 1) {
    return { summary: { total: 0, ready: 0, fail: 0, skip: 0 }, rows: [], notes: ["File empty"] };
  }

  // 1. Bulk Fetch Data for Validation
  const users = await User.findAll({ 
    include: [{ model: Role, as: "role", where: { name: "CADET" } }],
    attributes: ["id", "email"]
  });
  const vessels = await Vessel.findAll({ attributes: ["id", "imo_number"] });

  const userMap = new Map<string, number>(users.map((u: any) => [u.email?.toLowerCase(), u.id]));
  const vesselMap = new Map<string, number>(vessels.map((v: any) => [v.vessel_name?.toLowerCase(), v.id]));

  const rows: AssignImportPreviewRow[] = [];
  const dataRows = aoa.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i];
    const email = String(raw[0] || "").trim();
    const imo = String(raw[1] || "").trim();
    const joined = raw[2] ? new Date(raw[2]).toISOString().split("T")[0] : null; // Simple date parsing
    const left = raw[3] ? new Date(raw[3]).toISOString().split("T")[0] : null;
    const rank = String(raw[4] || "").trim();

    const issues: string[] = [];
    const cadet_id = userMap.get(email.toLowerCase()) || null;
    const vessel_id = vesselMap.get(imo) || null;

    if (!email) issues.push("Missing email");
    else if (!cadet_id) issues.push("Cadet not found");

    if (!imo) issues.push("Missing IMO");
    else if (!vessel_id) issues.push("Vessel not found");

    if (!joined) issues.push("Missing Join Date");

    // Overlap Check (Expensive but necessary)
    if (cadet_id && joined) {
      const overlap = await CadetVesselAssignment.findOne({
        where: {
          cadet_id,
          [Op.or]: [
            {
              // New start date falls inside existing range
              date_joined: { [Op.lte]: joined },
              date_left: { [Op.or]: [{ [Op.gte]: joined }, { [Op.eq]: null }] }
            },
            {
              // New assignment completely engulfs existing one (rare but possible)
              date_joined: { [Op.gte]: joined },
              date_left: left ? { [Op.lte]: left } : { [Op.ne]: null } 
            }
          ]
        }
      });
      if (overlap) issues.push("Dates overlap with existing assignment");
    }

    rows.push({
      row_number: i + 2,
      status: issues.length ? "FAIL" : "READY",
      normalized: { email, vessel_imo: imo, date_joined: joined, date_left: left, rank },
      derived: { cadet_id, vessel_id },
      issues,
    });
  }

  return {
    summary: {
      total: rows.length,
      ready: rows.filter(r => r.status === "READY").length,
      fail: rows.filter(r => r.status === "FAIL").length,
      skip: 0,
    },
    rows,
    notes: [],
  };
}