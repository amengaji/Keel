# D:\Projects\Keel\fix-dashboard-clickable.ps1

# ==============================================================================
# 1. FIX BACKEND MODELS (src/models/index.ts)
#    - Exports TaskTemplate & CadetVesselAssignment so the Dashboard Service can find them.
# ==============================================================================
$modelsContent = @'
import sequelize from "../config/database.js";
import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "./CadetFamiliarisationState.js";
import TaskTemplate from "./TaskTemplate.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";

// Apply associations
import "./associations.js";

export {
  sequelize,
  Role,
  User,
  ShipType,
  Vessel,
  FamiliarisationSectionTemplate,
  FamiliarisationTaskTemplate,
  CadetFamiliarisationState,
  TaskTemplate,
  CadetVesselAssignment
};
'@
Set-Content -Path "keel-backend\src\models\index.ts" -Value $modelsContent -Encoding UTF8
Write-Host "✅ Fixed Backend Models (models/index.ts)"


# ==============================================================================
# 2. FIX BACKEND ENTRY (src/index.ts)
#    - Removes manual associations that cause "Alias 'role' already used" crash.
#    - Ensures Dashboard routes are registered.
# ==============================================================================
$indexContent = @'
console.log("🔥 KEEL BACKEND STARTED FROM SRC 🔥");
import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// 1. Auth & Core Routes
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";
import roleRoutes from "./routes/role.routes.js";

// 2. Master Data Routes
import shipTypeRoutes from "./routes/shipType.routes.js";
import vesselRoutes from "./routes/vessel.routes.js";

// 3. Familiarisation (Cadet Side) Routes
import famSectionRoutes from "./routes/famSectionTemplate.routes.js";
import famTaskRoutes from "./routes/famTaskTemplate.routes.js";
import famTaskBulkRoutes from "./routes/famTaskTemplateBulk.routes.js";
import famStructureBulkRoutes from "./routes/famStructureBulk.routes.js";
import cadetFamiliarisationRoutes from "./routes/cadetFamiliarisation.routes.js";
import familiarisationTaskRoutes from "./routes/familiarisationTask.routes.js";
import progressRoutes from "./routes/familiarisationProgress.routes.js";
import reviewRoutes from "./routes/familiarisationReview.routes.js";
import trbFamiliarisationRoutes from "./routes/trbFamiliarisation.routes.js";
import familiarisationInitRoutes from "./routes/familiarisationInit.routes.js";
import familiarisationTaskUpdateRoutes from "./routes/familiarisationTaskUpdate.routes.js";
import familiarisationSectionSubmitRoutes from "./routes/familiarisationSectionSubmit.routes.js";
import vesselAssignmentRoutes from "./routes/vesselAssignment.routes.js";

// 4. Admin Routes
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
import adminVesselAssignmentCloseRoutes from "./admin/routes/adminVesselAssignmentClose.routes.js";
import adminDashboardRoutes from "./admin/routes/adminDashboard.routes.js";

// 5. Audit Routes
import adminAuditRoutes from "./admin/audit/routes/adminAudit.routes.js";

dotenv.config();

import sequelize from "./config/database.js";
// FIX: Import directly from index to use centralized associations
import { Role, User } from "./models/index.js";

export { User, Role };

const app: Application = express();
const PORT = process.env.PORT || 5000;

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

// Admin API
app.use("/api/v1/admin", adminUsersRolesRoutes);
app.use("/api/v1/admin", adminShipTypesRoutes);
app.use("/api/v1/admin", adminVesselsRoutes);
app.use("/api/v1/admin", adminTrbRoutes);
app.use("/api/v1/admin", adminTrbRoutes); // Also mount trbReviewRoutes logic if needed
app.use("/api/v1/admin", trbReviewRoutes); // Separate mount to be safe
app.use("/api/v1/admin/audit", adminAuditRoutes);
app.use("/api/v1/admin", adminTraineesRoutes);
app.use("/api/v1/admin", adminCadetProfilesRoutes);
app.use("/api/v1/admin", adminImportsRoutes);
app.use("/api/v1/admin", adminVesselImportsRoutes);
app.use("/api/v1/admin", adminCadetAssignmentsRoutes);
app.use("/api/v1/admin", adminVesselAssignmentsRoutes);
app.use("/api/v1/admin", adminVesselAssignmentCloseRoutes);
app.use("/api/v1/admin", adminDashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Keel Backend Server is running 🚢" });
});

async function seedRoles() {
  const defaultRoles = ["CADET", "CTO", "MASTER", "SHORE", "ADMIN"];
  for (let roleName of defaultRoles) {
    await Role.findOrCreate({ where: { role_name: roleName } });
  }
  console.log("⭐ Default roles ensured");
}

sequelize
  .authenticate()
  .then(async () => {
    console.log("🟢 Database connected");
    await seedRoles();
    app.listen(PORT, () => {
      console.log(`🚀 Keel backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Unable to connect:", err);
  });
'@
Set-Content -Path "keel-backend\src\index.ts" -Value $indexContent -Encoding UTF8
Write-Host "✅ Fixed Backend Entry (src/index.ts)"


# ==============================================================================
# 3. FIX FRONTEND DASHBOARD (AdminDashboardPage.tsx)
#    - Fetches real data.
#    - Adds CLICK NAVIGATION to relevant pages.
# ==============================================================================
$frontendContent = @'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  StatCard,
} from "../components/ui/Card";
import {
  Ship,
  Users,
  LayoutList,
  RefreshCw,
  PenTool,
} from "lucide-react";

type DashboardStats = {
  vessels: { active: number };
  cadets: { total: number; onboard: number; shore: number };
  tasks: { total_templates: number };
  signatures: { pending: number; ready_to_lock: number };
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/dashboard", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load stats");
      setStats(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load Command Center stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shore Command Center</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Fleet-wide training status, operational health, and live statistics.
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* CLICKABLE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* 1. Active Vessels -> Go to Vessels List */}
        <div className="cursor-pointer transition-opacity hover:opacity-80">
          <StatCard
            label="Active Vessels"
            value={loading ? "-" : stats?.vessels.active ?? 0}
            icon={<Ship size={20} />}
            onClick={() => navigate("/admin/vessels")}
          />
        </div>

        {/* 2. Cadets Onboard -> Go to Trainees List */}
        <div className="cursor-pointer transition-opacity hover:opacity-80">
          <StatCard
            label="Cadets Onboard"
            value={loading ? "-" : stats?.cadets.onboard ?? 0}
            icon={<Users size={20} />}
            tone={stats?.cadets.onboard ? "success" : "neutral"}
            onClick={() => navigate("/admin/trainees")}
          />
        </div>

        {/* 3. Total Trainees -> Go to Trainees List */}
        <div className="cursor-pointer transition-opacity hover:opacity-80">
          <StatCard
            label="Total Trainees"
            value={loading ? "-" : stats?.cadets.total ?? 0}
            icon={<Users size={20} />}
            onClick={() => navigate("/admin/trainees")}
          />
        </div>

        {/* 4. TRB Tasks Defined -> Go to Tasks Management */}
        <div className="cursor-pointer transition-opacity hover:opacity-80">
          <StatCard
            label="TRB Tasks Defined"
            value={loading ? "-" : stats?.tasks.total_templates ?? 0}
            icon={<LayoutList size={20} />}
            onClick={() => navigate("/admin/tasks")}
          />
        </div>
      </div>

      {/* PHASE 4 PLACEHOLDERS (Non-clickable for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
        <Card>
          <CardHeader 
            title="Signature Status (Phase 4)" 
            subtitle="Pending implementation of Officer Sign-off logic"
          />
          <div className="p-4 flex items-center justify-center h-32 text-sm text-[hsl(var(--muted-foreground))] italic border border-dashed rounded m-4 bg-[hsl(var(--muted))]/30">
            No live signature data available yet.
          </div>
        </Card>

        <Card>
           <CardHeader 
            title="Audit Readiness (Phase 4)" 
            subtitle="Pending implementation of Evidence Verification"
          />
          <div className="p-4 flex items-center justify-center h-32 text-sm text-[hsl(var(--muted-foreground))] italic border border-dashed rounded m-4 bg-[hsl(var(--muted))]/30">
             Compliance metrics will appear here.
          </div>
        </Card>
      </div>
    </div>
  );
}
'@
Set-Content -Path "keel-web\src\admin\pages\AdminDashboardPage.tsx" -Value $frontendContent -Encoding UTF8
Write-Host "✅ Fixed Frontend: Connected API & Added Click Navigation"