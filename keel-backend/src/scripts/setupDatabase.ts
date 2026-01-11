// keel-backend/src/scripts/setupDatabase.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from "../config/database.js";
import { Role, User } from "../models/index.js";
import bcrypt from "bcryptjs";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log("🚀 Starting Robust Database Setup...");
    await sequelize.authenticate();
    console.log("✅ Database Connected.");

    // 1. Drop Views (CRITICAL: Prevents locks during table alteration)
    console.log("🗑️  Dropping existing views...");
    const viewsToDrop = [
      "admin_roles_v", "admin_users_v", "admin_ship_types_v", "admin_vessels_v",
      "admin_trb_cadets_v", "admin_trb_section_progress_v", "admin_trb_task_evidence_v",
      "admin_audit_timeline_v"
    ];
    for (const view of viewsToDrop) {
      await sequelize.query(`DROP VIEW IF EXISTS public.${view} CASCADE`).catch(() => {});
    }

    // 2. PRE-SYNC MANUAL FIXES (Prevents "Value too long" errors)
    console.log("🩹 Applying pre-sync column length fixes...");
    
    // Fix for Section Templates
    await sequelize.query(`
        ALTER TABLE IF EXISTS "fam_section_templates" 
        ALTER COLUMN "section_code" TYPE VARCHAR(100);
    `).catch(() => {});

    // Fix for Task Templates (The error you just faced)
    await sequelize.query(`
        ALTER TABLE IF EXISTS "fam_task_templates" 
        ALTER COLUMN "task_code" TYPE VARCHAR(100);
    `).catch(() => {});

    // 3. Sync Tables (Safety Alter Mode)
    console.log("🛠️  Syncing database tables...");
    await sequelize.sync({ alter: true });
    console.log("✅ Tables Synced.");

    // 4. Post-Sync Manual Constraints
    console.log("⚓ Applying manual constraints...");
    try {
      await sequelize.query(`
        ALTER TABLE "vessels" 
        ADD CONSTRAINT "vessels_imo_number_key" UNIQUE ("imo_number");
      `);
    } catch (e: any) {
      console.log("ℹ️  Constraint already exists or skipped.");
    }

    // 5. Run SQL Migrations
    console.log("📜 Applying SQL Migrations from files...");
    const migrationDirs = [
      path.join(__dirname, '../../db/migrations'),
      path.join(__dirname, '../db/migrations')
    ];

    for (const dir of migrationDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          console.log(`   Executing ${file}...`);
          const sql = fs.readFileSync(path.join(dir, file), 'utf8');
          try {
            const cleanSql = sql.replace(/\\\n/g, '\n');
            await sequelize.query(cleanSql);
          } catch (err: any) {
            if (!err.message.includes("already exists")) {
               console.warn(`      ⚠️ Error in ${file}:`, err.message);
            }
          }
        }
      }
    }
    console.log("✅ Migrations Applied.");

    // 6. Seed Roles
    console.log("🌱 Seeding Roles...");
    const defaultRoles = ["CADET", "CTO", "MASTER", "SHORE", "ADMIN"];
    const roleMap: Record<string, number> = {};
    for (const roleName of defaultRoles) {
      const [role] = await Role.findOrCreate({ where: { role_name: roleName } });
      roleMap[roleName] = role.id;
    }

    // 7. Seed Default Users
    console.log("🌱 Seeding Default Users...");
    const users = [
      { email: "admin@keel.com", name: "Admin User", pass: "admin123!", role: "ADMIN" },
      { email: "cadet@keel.com", name: "Cadet User", pass: "cadet123", role: "CADET" }
    ];
    for (const u of users) {
      const existing = await User.findOne({ where: { email: u.email } });
      if (!existing) {
        const hash = await bcrypt.hash(u.pass, 10);
        await User.create({
          email: u.email,
          full_name: u.name,
          password_hash: hash,
          role_id: roleMap[u.role]
        });
        console.log(`   ✅ Created ${u.role}: ${u.email}`);
      }
    }

    console.log("\n🎉🎉 DATABASE SETUP SUCCESSFUL! 🎉🎉");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ FATAL SETUP ERROR:", error);
    process.exit(1);
  }
}

setupDatabase();