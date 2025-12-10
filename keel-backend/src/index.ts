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

dotenv.config();

import { sequelize } from "./models/index.js";
import Role from "./models/Role.js";

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Connect + Sync + Seed + Start Server
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("🟢 Database connected + models synced");

    // ENSURE ROLES EXIST
    await seedRoles();

    app.listen(PORT, () => {
      console.log(`🚀 Keel backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Unable to connect:", err);
  });
