import sequelize from "../config/database.js";
// We import these directly to ensure they are loaded
import TaskTemplate from "../models/TaskTemplate.js";
import CadetVesselAssignment from "../models/CadetVesselAssignment.js";

async function syncMissingTables() {
  try {
    console.log("⏳ Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected.");

    console.log("🛠  Syncing table: TaskTemplate...");
    await TaskTemplate.sync({ alter: true });

    console.log("🛠  Syncing table: CadetVesselAssignment...");
    await CadetVesselAssignment.sync({ alter: true });

    console.log("✅ All missing tables created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

syncMissingTables();
