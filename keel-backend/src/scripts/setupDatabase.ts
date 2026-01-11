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
    console.log("🚀 Starting Database Setup...");
    
    // 1. Authenticate
    await sequelize.authenticate();
    console.log("✅ Database Connected.");

    // 2. Drop Views (to prevent locking/dependency issues during table sync)
    console.log("🗑️  Dropping existing views...");
    const viewsToDrop = [
      "admin_roles_v",
      "admin_users_v",
      "admin_ship_types_v",
      "admin_vessels_v",
      "admin_trb_cadets_v",
      "admin_trb_section_progress_v",
      "admin_trb_task_evidence_v",
      "admin_audit_timeline_v"
    ];
    for (const view of viewsToDrop) {
      await sequelize.query(`DROP VIEW IF EXISTS public.${view} CASCADE`);
    }

    // 3. Sync All Tables
    console.log("🛠️  Syncing database tables...");
    // This creates tables if they don't exist, and alters columns if they changed
    await sequelize.sync({ alter: true });
    console.log("✅ Tables Synced.");

    // 4. Run SQL Migrations (Views & Fixes)
    console.log("📜 Applying SQL Migrations...");
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
            await sequelize.query(sql);
          } catch (err: any) {
            console.warn(`   ⚠️ Error in ${file} (might be okay if replacing):`, err.message);
          }
        }
      }
    }
    console.log("✅ Migrations Applied.");

    // 5. Seed Roles
    console.log("🌱 Seeding Roles...");
    const defaultRoles = ["CADET", "CTO", "MASTER", "SHORE", "ADMIN"];
    const roleMap: Record<string, number> = {};
    
    for (const roleName of defaultRoles) {
      const [role] = await Role.findOrCreate({ where: { role_name: roleName } });
      roleMap[roleName] = role.id;
    }

    // 6. Seed Users
    console.log("🌱 Seeding Default Users...");
    const users = [
      { email: "admin@keel.com", name: "Admin User", pass: "admin123!", role: "ADMIN" },
      { email: "cadet@keel.com", name: "Cadet User", pass: "cadet123", role: "CADET" },
      { email: "master@keel.com", name: "Master User", pass: "master123", role: "MASTER" },
      { email: "shore@keel.com", name: "Shore User", pass: "shore123", role: "SHORE" }
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
        console.log(`   Created ${u.role}: ${u.email}`);
      }
    }

    console.log("🎉 Database Setup Complete! You can now run 'npm run dev'.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Setup Failed:", error);
    process.exit(1);
  }
}

setupDatabase();