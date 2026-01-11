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
// NEW ROUTES
import adminTasksRoutes from "./admin/routes/adminTasks.routes.js";
import adminTaskImportsRoutes from "./admin/routes/adminTaskImports.routes.js"; 

// 5. Audit Routes
import adminAuditRoutes from "./admin/audit/routes/adminAudit.routes.js";

dotenv.config();

import sequelize from "./config/database.js";
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
app.use("/api/v1/admin/trb", trbReviewRoutes);
app.use("/api/v1/admin/audit", adminAuditRoutes);
app.use("/api/v1/admin", adminTraineesRoutes);
app.use("/api/v1/admin", adminCadetProfilesRoutes);
app.use("/api/v1/admin", adminImportsRoutes);
app.use("/api/v1/admin", adminVesselImportsRoutes);
app.use("/api/v1/admin", adminCadetAssignmentsRoutes);
app.use("/api/v1/admin", adminVesselAssignmentsRoutes);
app.use("/api/v1/admin", adminVesselAssignmentCloseRoutes);
app.use("/api/v1/admin", adminDashboardRoutes);
// REGISTER NEW ROUTES
app.use("/api/v1/admin", adminTasksRoutes); 
app.use("/api/v1/admin", adminTaskImportsRoutes); 

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
