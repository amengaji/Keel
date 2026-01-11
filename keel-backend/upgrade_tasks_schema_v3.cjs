const path = require("path");
const { Sequelize } = require("sequelize");

// 1. Load .env
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// 2. Config
const dbPass = process.env.DB_PASS || "admin123";
const dbName = process.env.DB_NAME || "keel_db";
const dbUser = process.env.DB_USER || "postgres";
const dbHost = process.env.DB_HOST || "localhost";

console.log(`🔧 Connecting to ${dbName}...`);

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "postgres",
  logging: false,
});

async function upgradeDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected.");
    
    const queryInterface = sequelize.getQueryInterface();
    const table = "task_templates";

    console.log("🚀 Adding 'trainee_type' column...");

    try {
      await queryInterface.addColumn(table, "trainee_type", {
        type: Sequelize.STRING(50),
        defaultValue: "All"
      });
      console.log("   + Added trainee_type");
    } catch (e) {
      console.log("   - trainee_type already exists or error: " + e.message);
    }

    console.log("✅ Database Upgrade Complete.");
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

upgradeDB();
