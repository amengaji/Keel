const { Sequelize } = require("sequelize");
require("dotenv").config();

// Connect to DB
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  }
);

async function addColumn() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected.");

    console.log("🔄 Checking for 'department' column...");
    
    const queryInterface = sequelize.getQueryInterface();
    const tableDesc = await queryInterface.describeTable("task_templates");

    if (tableDesc.department) {
      console.log("⚠️ Column 'department' already exists. Skipping.");
    } else {
      console.log("➕ Adding 'department' column...");
      await queryInterface.addColumn("task_templates", "department", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "General"
      });
      console.log("✅ Column added successfully!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addColumn();
