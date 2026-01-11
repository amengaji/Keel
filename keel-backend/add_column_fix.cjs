const path = require("path");
const { Sequelize } = require("sequelize");

// 1. Explicitly load .env from the current directory
const envPath = path.join(__dirname, ".env");
console.log("📂 Loading environment config from:", envPath);
const result = require("dotenv").config({ path: envPath });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file. Using system environment variables.");
}

// 2. Ensure Password is a string (Fixes SASL error)
const dbName = process.env.DB_NAME || "keel_db";
const dbUser = process.env.DB_USER || "postgres";
const dbPass = process.env.DB_PASSWORD === undefined ? "" : process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST || "localhost";

console.log(`🔧 DB Config: Host=${dbHost}, User=${dbUser}, DB=${dbName}, PassLength=${dbPass.length}`);

// 3. Connect
const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "postgres",
  logging: false,
});

async function fixDatabase() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected.");

    console.log("🔄 Adding 'department' column to task_templates...");
    
    // Run Raw SQL to safely add the column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE task_templates 
      ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'General';
    `);

    console.log("✅ SUCCESS: Column 'department' added.");
  } catch (error) {
    console.error("❌ ERROR:", error.original ? error.original.message : error.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();
