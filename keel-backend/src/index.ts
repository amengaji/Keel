//keel-backend/src/index.ts
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

app.use(cookieParser()); // 🔑 REQUIRED FOR AUTH COOKIES
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

// -----------------------------------------------------------------------------
// DATABASE STARTUP
// -----------------------------------------------------------------------------
// IMPORTANT (Phase 3 - Track A):
// - We DO NOT use `alter: true`
// - Schema is considered STABLE
// - Admin DB views depend on columns and must not break
// - All schema changes must be done via migrations (later phases)
// -----------------------------------------------------------------------------

sequelize
  .authenticate()
  .then(async () => {
    console.log("🟢 Database connected (no schema alterations)");
    console.log("🔍 DB NAME:", process.env.DB_NAME);
    console.log("🔍 DB HOST:", process.env.DB_HOST);

    // ENSURE ROLES EXIST (safe: data-level, not schema-level)
    await seedRoles();

    app.listen(PORT, () => {
      console.log(`🚀 Keel backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Unable to connect:", err);
  });
