const { Sequelize } = require("sequelize");

// HARDCODED CREDENTIALS to bypass .env issues
const dbName = "keel_db";
const dbUser = "postgres";
const dbPass = "admin123"; 
const dbHost = "localhost";

console.log(`🔧 Connecting to ${dbName} as ${dbUser}...`);

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "postgres",
  logging: false,
});

async function upgradeDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected successfully.");
    
    const queryInterface = sequelize.getQueryInterface();
    const table = "task_templates";

    console.log("🚀 Adding new columns...");

    const columns = [
      { name: "instructions", type: "TEXT" },
      { name: "safety_requirements", type: "TEXT" },
      { name: "evidence_type", type: "VARCHAR(50) DEFAULT 'NONE'" },
      { name: "verification_method", type: "VARCHAR(50) DEFAULT 'OBSERVATION'" },
      { name: "frequency", type: "VARCHAR(50) DEFAULT 'ONCE'" }
    ];

    for (const col of columns) {
      try {
        await sequelize.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
        `);
        console.log(`   + Added/Checked ${col.name}`);
      } catch (e) {
        console.log(`   - Error adding ${col.name}: ${e.message}`);
      }
    }

    console.log("✅ Database Upgrade Complete.");
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

upgradeDB();
