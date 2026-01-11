# Keel - Step 4: Admin Task Management Setup
# Run this from the root of your repository (e.g., D:\Projects\Keel)

$Root = Get-Location

function Write-KeelFile {
    param (
        [string]$RelativePath,
        [string]$Content
    )
    
    $FullPath = Join-Path $Root $RelativePath
    $Dir = Split-Path $FullPath
    
    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
    }
    
    Set-Content -Path $FullPath -Value $Content -Encoding UTF8
    Write-Host "✅ Wrote: $RelativePath"
}

# ==============================================================================
# 1. BACKEND: CONTROLLER & ROUTES (Standard CRUD)
# ==============================================================================

$FamTaskController = @"
// keel-backend/src/controllers/famTaskTemplate.controller.ts
import { Request, Response } from "express";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import ShipType from "../models/ShipType.js";

class FamTaskTemplateController {
  
  // NEW: Get ALL tasks (Admin View)
  static async getAll(req: Request, res: Response) {
    try {
      const tasks = await FamiliarisationTaskTemplate.findAll({
        include: [
          {
            model: FamiliarisationSectionTemplate,
            as: "section", 
            include: [{ model: ShipType, as: "shipType" }]
          }
        ],
        order: [
          ["cadet_category", "ASC"],
          [{ model: FamiliarisationSectionTemplate, as: "section" }, "order_number", "ASC"],
          ["order_number", "ASC"],
        ],
      });
      return res.json({ success: true, data: tasks });
    } catch (err) {
      console.error("Get All Tasks error:", err);
      return res.status(500).json({ message: "Unable to fetch tasks" });
    }
  }

  // Create a task template
  static async create(req: Request, res: Response) {
    try {
      const {
        section_template_id,
        cadet_category,
        task_code,
        task_description,
        order_number,
        is_mandatory
      } = req.body;

      if (!section_template_id || !cadet_category || !task_code || !task_description || !order_number) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const section = await FamiliarisationSectionTemplate.findByPk(section_template_id);
      if (!section) {
        return res.status(400).json({ message: "Invalid section_template_id" });
      }

      const task = await FamiliarisationTaskTemplate.create({
        section_template_id,
        cadet_category,
        task_code,
        task_description,
        order_number,
        is_mandatory: is_mandatory ?? true,
      });

      return res.status(201).json({ success: true, data: task });
    } catch (err) {
      console.error("Create Task Template Error:", err);
      return res.status(500).json({ message: "Unable to create task template" });
    }
  }

  // Get tasks for a section
  static async getBySection(req: Request, res: Response) {
    try {
      const { section_template_id } = req.params;

      const tasks = await FamiliarisationTaskTemplate.findAll({
        where: { section_template_id },
        order: [["order_number", "ASC"]],
      });

      return res.json(tasks);
    } catch (err) {
      console.error("Get Task Templates error:", err);
      return res.status(500).json({ message: "Unable to fetch task templates" });
    }
  }

  // Delete a task template
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await FamiliarisationTaskTemplate.destroy({ where: { id } });

      if (!result) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json({ success: true, message: "Task deleted" });
    } catch (err) {
      console.error("Delete Task Template error:", err);
      return res.status(500).json({ message: "Unable to delete task template" });
    }
  }
}

export default FamTaskTemplateController;
"@

$FamTaskRoutes = @"
// keel-backend/src/routes/famTaskTemplate.routes.ts
import { Router } from "express";
import FamTaskTemplateController from "../controllers/famTaskTemplate.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = Router();

// GET /fam-tasks -> List all (Admin)
router.get("/", authGuard, FamTaskTemplateController.getAll);

// GET /fam-tasks/section/:id
router.get("/section/:section_template_id", authGuard, FamTaskTemplateController.getBySection);

// POST /fam-tasks
router.post("/", authGuard, FamTaskTemplateController.create);

// DELETE /fam-tasks/:id
router.delete("/:id", authGuard, FamTaskTemplateController.delete);

export default router;
"@

# ==============================================================================
# 2. BACKEND: IMPORT SERVICE, CONTROLLER, ROUTES
# ==============================================================================

$ImportService = @"
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
        task_code: task_code || `T-${taskCount + 1}`,
        task_description: description,
        order_number: taskCount + 1,
        is_mandatory
      }, { transaction: tx });

      createdCount++;
    }
  });

  return { 
    success: true, 
    message: `Imported ${createdCount} tasks successfully`,
    created: createdCount 
  };
}
"@

$ImportController = @"
// keel-backend/src/admin/controllers/adminTaskImports.controller.ts
import { Request, Response } from "express";
import { 
  buildTaskImportTemplateBuffer, 
  previewTaskImportXlsx, 
  commitTaskImportXlsx 
} from "../services/adminTaskImports.service.js";

export async function downloadTemplate(req: Request, res: Response) {
  try {
    const buffer = await buildTaskImportTemplateBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="keel_tasks_import.xlsx"');
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
}

export async function previewImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "File required" });
    const result = await previewTaskImportXlsx(file.buffer);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
}

export async function commitImport(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "File required" });
    const result = await commitTaskImportXlsx(file.buffer);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
}
"@

$ImportRoutes = @"
// keel-backend/src/admin/routes/adminTaskImports.routes.ts
import { Router } from "express";
import multer from "multer";
import { authGuard } from "../../middleware/auth.middleware.js";
import { downloadTemplate, previewImport, commitImport } from "../controllers/adminTaskImports.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/template", authGuard, downloadTemplate);
router.post("/preview", authGuard, upload.single("file"), previewImport);
router.post("/commit", authGuard, upload.single("file"), commitImport);

export default router;
"@

# ==============================================================================
# 3. UPDATE INDEX.TS TO REGISTER NEW ROUTES
# ==============================================================================

$IndexTs = @"
// keel-backend/src/index.ts
console.log("🔥 KEEL BACKEND STARTED FROM SRC 🔥");
import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";
import shipTypeRoutes from "./routes/shipType.routes.js";
import vesselRoutes from "./routes/vessel.routes.js";
import famSectionRoutes from "./routes/famSectionTemplate.routes.js";
import famTaskRoutes from "./routes/famTaskTemplate.routes.js";
import famTaskBulkRoutes from "./routes/famTaskTemplateBulk.routes.js";
import famStructureBulkRoutes from "./routes/famStructureBulk.routes.js";
import cadetFamiliarisationRoutes from "./routes/cadetFamiliarisation.routes.js";
import familiarisationTaskRoutes from "./routes/familiarisationTask.routes.js";
import progressRoutes from "./routes/familiarisationProgress.routes.js";
import reviewRoutes from "./routes/familiarisationReview.routes.js";
import trbFamiliarisationRoutes from "./routes/trbFamiliarisation.routes.js";
import roleRoutes from "./routes/role.routes.js";
import vesselAssignmentRoutes from "./routes/vesselAssignment.routes.js";
import familiarisationInitRoutes from "./routes/familiarisationInit.routes.js";
import familiarisationTaskUpdateRoutes from "./routes/familiarisationTaskUpdate.routes.js";
import familiarisationSectionSubmitRoutes from "./routes/familiarisationSectionSubmit.routes.js";
import adminUsersRolesRoutes from "./admin/routes/adminUsersRoles.routes.js";
import adminShipTypesRoutes from "./admin/routes/adminShipTypes.routes.js";
import adminVesselsRoutes from "./admin/routes/adminVessels.routes.js";
import adminTrbRoutes from "./admin/routes/adminTrb.routes.js";
import trbReviewRoutes from "./admin/routes/trbReview.routes.js";
import adminTraineesRoutes from "./admin/routes/adminTrainees.routes.js";
import adminCadetProfilesRoutes from "./admin/routes/adminCadetProfiles.routes.js";
import adminImportsRoutes from "./admin/routes/adminImports.routes.js";
import adminVesselImportsRoutes from "./admin/routes/adminVesselImports.routes.js";
import adminCadetAssignmentsRoutes from "./admin/routes/adminCadetAssignments.routes.js";
import adminVesselAssignmentsRoutes from "./admin/routes/adminVesselAssignments.routes.js";
import adminTaskImportsRoutes from "./admin/routes/adminTaskImports.routes.js"; // NEW

/* -------------------------------------------------------------------------- */
/* ADMIN — AUDIT EXPORT ROUTES (READ-ONLY)                                     */
/* -------------------------------------------------------------------------- */
import adminAuditRoutes from "./admin/audit/routes/adminAudit.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();

import sequelize from "./config/database.js";
import Role from "./models/Role.js";
import User from "./models/User.js";

// Associations
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(User, { foreignKey: "role_id" });

export { User, Role };

const app: Application = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// GLOBAL MIDDLEWARE (ORDER MATTERS)
// -----------------------------------------------------------------------------

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/ship-types", shipTypeRoutes);
app.use("/vessels", vesselRoutes);
app.use("/fam-sections", famSectionRoutes);
app.use("/fam-tasks", famTaskRoutes);
app.use("/fam-tasks/bulk", famTaskBulkRoutes);
app.use("/fam-structure/bulk", famStructureBulkRoutes);
app.use("/api", cadetFamiliarisationRoutes);
app.use("/api", familiarisationTaskRoutes);
app.use("/api", progressRoutes);
app.use("/api", reviewRoutes);
app.use("/api", trbFamiliarisationRoutes);
app.use("/api", roleRoutes);
app.use("/vessels", vesselAssignmentRoutes);
app.use("/api", familiarisationInitRoutes);
app.use("/api", familiarisationTaskUpdateRoutes);
app.use("/api", familiarisationSectionSubmitRoutes);
app.use("/api/v1/admin", adminUsersRolesRoutes);
app.use("/api/v1/admin", adminShipTypesRoutes);
app.use("/api/v1/admin", adminVesselsRoutes);
app.use("/api/v1/admin/trb", adminTrbRoutes);
app.use("/api/v1/admin/trb/review", trbReviewRoutes);
app.use("/api/v1/admin/audit", adminAuditRoutes);
app.use("/api/v1/admin", adminTraineesRoutes);
app.use("/api/v1/admin", adminCadetProfilesRoutes);
app.use("/api/v1/admin", adminImportsRoutes);
app.use("/api/v1/admin", adminVesselImportsRoutes);
app.use("/api/v1/admin", adminCadetAssignmentsRoutes);
app.use("/api/v1/admin", adminVesselAssignmentsRoutes);
app.use("/api/v1/admin/imports/tasks", adminTaskImportsRoutes); // NEW ROUTE

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Keel Backend Server is running 🚢" });
});

// Function to insert default roles
async function seedRoles() {
  const defaultRoles = ["CADET", "CTO", "MASTER", "SHORE", "ADMIN"];

  for (let roleName of defaultRoles) {
    await Role.findOrCreate({
      where: { role_name: roleName }
    });
  }

  console.log("⭐ Default roles ensured");
}

sequelize
  .authenticate()
  .then(async () => {
    console.log("🟢 Database connected (no schema alterations)");
    console.log("🔍 DB NAME:", process.env.DB_NAME);
    console.log("🔍 DB HOST:", process.env.DB_HOST);

    // ENSURE ROLES EXIST
    await seedRoles();

    app.listen(PORT, () => {
      console.log(`🚀 Keel backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Unable to connect:", err);
  });
"@

# ==============================================================================
# 4. FRONTEND: PAGES & COMPONENTS
# ==============================================================================

$TaskImportModal = @"
// keel-web/src/admin/components/TaskImportModal.tsx
import { useState, useRef } from "react";
import { toast } from "sonner";
import { X, Upload, FileDown, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export function TaskImportModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleDownloadTemplate() {
    window.location.href = "/api/v1/admin/imports/tasks/template";
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/v1/admin/imports/tasks/preview", { method: "POST", body: formData });
      const json = await res.json();
      setPreview(json.data);
    } catch { toast.error("Preview failed"); }
    finally { setLoading(false); }
  }

  async function handleCommit() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/v1/admin/imports/tasks/commit", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        onSuccess();
      } else {
        toast.error("Commit failed");
      }
    } catch { toast.error("Commit failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--card))] w-full max-w-3xl rounded-lg border border-[hsl(var(--border))] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center">
          <h3 className="font-semibold">Import Tasks</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Template */}
          <div className="flex justify-between items-center p-4 bg-[hsl(var(--muted))] rounded-lg">
            <div className="text-sm">
              <div className="font-medium">1. Download Template</div>
              <div className="text-[hsl(var(--muted-foreground))]">Use the official Excel template.</div>
            </div>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <FileDown size={16} /> Download
            </button>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-2">
            <div className="font-medium text-sm">2. Upload & Preview</div>
            <div className="flex gap-2">
              <input type="file" accept=".xlsx" onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); }} className="text-sm border p-2 rounded flex-1" />
              <button onClick={handlePreview} disabled={!file || loading} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                {loading ? "Processing..." : "Preview"}
              </button>
            </div>
          </div>

          {/* Step 3: Result */}
          {preview && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <div className="text-green-600 font-medium">Ready: {preview.summary.ready}</div>
                <div className="text-red-600 font-medium">Fail: {preview.summary.fail}</div>
              </div>
              
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr><th className="p-2">Row</th><th className="p-2">Status</th><th className="p-2">Description</th></tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row: any) => (
                      <tr key={row.row_number} className="border-t">
                        <td className="p-2">{row.row_number}</td>
                        <td className="p-2">
                          {row.status === "READY" ? <CheckCircle2 size={14} className="text-green-500"/> : <AlertTriangle size={14} className="text-red-500"/>}
                        </td>
                        <td className="p-2 truncate max-w-xs">{row.data.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-[hsl(var(--muted))] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded">Cancel</button>
          <button 
            onClick={handleCommit} 
            disabled={!preview || preview.summary.ready === 0 || loading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            Commit Import
          </button>
        </div>
      </div>
    </div>
  );
}
"@

$AdminTasksPage = @"
// keel-web/src/admin/pages/AdminTasksPage.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  ClipboardList, Upload, Filter, Trash2, Loader2 
} from "lucide-react";
import { TaskImportModal } from "../components/TaskImportModal"; 

type Task = {
  id: number;
  task_code: string;
  task_description: string;
  cadet_category: string;
  is_mandatory: boolean;
  section?: {
    name: string;
    shipType?: {
      name: string;
    };
  };
};

export function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await fetch("/fam-tasks", { credentials: "include" }); // Using the generic route
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(\`/fam-tasks/\${id}\`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast.success("Task deleted");
        loadTasks();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.task_description.toLowerCase().includes(search.toLowerCase()) || 
                        t.task_code.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept ? t.cadet_category === filterDept : true;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList size={20} /> Task Management
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Master list of training tasks assigned to cadets.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90"
          >
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg">
        <div className="flex-1 relative">
          <input 
            placeholder="Search tasks..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          />
          <Filter className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={16} />
        </div>
        <select 
          className="px-3 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="DECK">Deck</option>
          <option value="ENGINE">Engine</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))] text-left font-medium">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Ship Type</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin inline" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[hsl(var(--muted-foreground))]">No tasks found.</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                  <td className="px-4 py-3 font-mono text-xs">{t.task_code}</td>
                  <td className="px-4 py-3 max-w-md truncate" title={t.task_description}>{t.task_description}</td>
                  <td className="px-4 py-3">{t.section?.shipType?.name || "—"}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{t.section?.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold">{t.cadet_category}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TaskImportModal 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => { loadTasks(); setIsImportOpen(false); }} 
      />
    </div>
  );
}
"@

$AdminSidebar = @"
// keel-web/src/admin/layout/AdminSidebar.tsx

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ship,
  Users,
  Anchor,
  FileCheck,
  ShieldAlert,
  Settings,
  LogOut,
  FileText,
  UserCheck,
  ClipboardList // New Icon for Tasks
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export function AdminSidebar() {
  const { logout, user } = useAuth();

  const navItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Vessels", to: "/admin/vessels", icon: Ship },
    { label: "Cadets", to: "/admin/cadets", icon: Users },
    { label: "Vessel Types", to: "/admin/vessel-types", icon: Anchor },
    { label: "Tasks", to: "/admin/tasks", icon: ClipboardList }, // NEW
    { label: "Approvals", to: "/admin/approvals", icon: UserCheck },
    
    // TRB Section
    { label: "Locked TRBs", to: "/admin/locked-trbs", icon: FileCheck },
    
    // Reports Section
    { label: "Reports", to: "/admin/reports", icon: FileText },
    
    // Audit Section
    { label: "Audit Mode", to: "/admin/audit", icon: ShieldAlert },
    
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--border))]">
        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))]">
            K
          </div>
          Keel
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="text-sm font-medium truncate">{user?.full_name}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</div>
        <div className="mt-1 text-xs font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--background))] inline-block border border-[hsl(var(--border))]">
          {user?.role}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              \`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors \${
                isActive
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              }\`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
"@

$AppTsx = @"
// keel-web/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";
import { AdminAuthGate } from "./admin/auth/AdminAuthGate";

// Admin Pages
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminLayout } from "./admin/layout/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminVesselsPage } from "./admin/pages/AdminVesselsPage";
import { AdminVesselDetailPage } from "./admin/pages/AdminVesselDetailPage";
import { AdminVesselCreatePage } from "./admin/pages/AdminVesselCreatePage";
import { AdminCadetsPage } from "./admin/pages/AdminCadetsPage";
import { AdminCadetDetailPage } from "./admin/pages/AdminCadetDetailPage";
import { AdminTraineeCreatePage } from "./admin/pages/AdminTraineeCreatePage";
import { AdminVesselTypesPage } from "./admin/pages/AdminVesselTypesPage";
import { AdminApprovalsPage } from "./admin/pages/AdminApprovalsPage";
import { AdminLockedTRBsPage } from "./admin/pages/AdminLockedTRBsPage";
import { AdminSystemSettingsPage } from "./admin/pages/AdminSystemSettingsPage";
import { AdminReportsPage } from "./admin/pages/AdminReportsPage";
import { AdminTasksPage } from "./admin/pages/AdminTasksPage"; // NEW

// Audit
import { AuditLandingPage } from "./admin/audit/AuditLandingPage";
import { AuditLayout } from "./admin/audit/AuditLayout";
import { AuditTRBPage } from "./admin/audit/AuditTRBPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected */}
          <Route
            path="/admin"
            element={
              <AdminAuthGate>
                <AdminLayout />
              </AdminAuthGate>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            
            {/* Vessels */}
            <Route path="vessels" element={<AdminVesselsPage />} />
            <Route path="vessels/new" element={<AdminVesselCreatePage />} />
            <Route path="vessels/:vesselId" element={<AdminVesselDetailPage />} />
            <Route path="vessel-types" element={<AdminVesselTypesPage />} />

            {/* Cadets */}
            <Route path="cadets" element={<AdminCadetsPage />} />
            <Route path="cadets/new" element={<AdminTraineeCreatePage />} />
            <Route path="cadets/:cadetId" element={<AdminCadetDetailPage />} />

            {/* Tasks (NEW) */}
            <Route path="tasks" element={<AdminTasksPage />} />

            {/* Workflow */}
            <Route path="approvals" element={<AdminApprovalsPage />} />
            <Route path="locked-trbs" element={<AdminLockedTRBsPage />} />
            
            {/* Reports */}
            <Route path="reports/*" element={<AdminReportsPage />} />

            {/* Settings */}
            <Route path="settings" element={<AdminSystemSettingsPage />} />
            
          </Route>

          {/* Audit Mode (Separate Layout) */}
          <Route
             path="/admin/audit"
             element={
               <AdminAuthGate>
                 <AuditLayout />
               </AdminAuthGate>
             }
          >
            <Route index element={<AuditLandingPage />} />
            <Route path="trb/:trbId" element={<AuditTRBPage />} />
          </Route>

        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
"@

# ==============================================================================
# EXECUTION
# ==============================================================================

Write-KeelFile "keel-backend/src/controllers/famTaskTemplate.controller.ts" $FamTaskController
Write-KeelFile "keel-backend/src/routes/famTaskTemplate.routes.ts" $FamTaskRoutes
Write-KeelFile "keel-backend/src/admin/services/adminTaskImports.service.ts" $ImportService
Write-KeelFile "keel-backend/src/admin/controllers/adminTaskImports.controller.ts" $ImportController
Write-KeelFile "keel-backend/src/admin/routes/adminTaskImports.routes.ts" $ImportRoutes
Write-KeelFile "keel-backend/src/index.ts" $IndexTs
Write-KeelFile "keel-web/src/admin/components/TaskImportModal.tsx" $TaskImportModal
Write-KeelFile "keel-web/src/admin/pages/AdminTasksPage.tsx" $AdminTasksPage
Write-KeelFile "keel-web/src/admin/layout/AdminSidebar.tsx" $AdminSidebar
Write-KeelFile "keel-web/src/App.tsx" $AppTsx

Write-Host "✅ Step 4 Complete: Admin Task Management & Imports Installed."