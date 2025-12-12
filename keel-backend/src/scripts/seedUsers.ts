import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

async function seedUsers() {
  try {
    console.log("🌱 Seeding users...");

    // Ensure DB connection
    await sequelize.authenticate();

    // Fetch roles
    const roles = await Role.findAll();
    const roleMap: Record<string, number> = {};

    roles.forEach((role: any) => {
      roleMap[role.role_name] = role.id;
    });

    if (!roleMap.ADMIN || !roleMap.CADET || !roleMap.MASTER) {
      throw new Error("Required roles missing. Run role seeding first.");
    }

    // Helper to create user if not exists
    async function createUserIfMissing(
      email: string,
      full_name: string,
      password: string,
      roleName: string
    ) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        console.log(`⚠️  User already exists: ${email}`);
        return;
      }

      const hash = await bcrypt.hash(password, 10);

      await User.create({
        email,
        full_name,
        password_hash: hash,
        role_id: roleMap[roleName],
      });

      console.log(`✅ Created ${roleName}: ${email}`);
    }

    // Seed users
    await createUserIfMissing(
      "admin@keel.com",
      "Admin User",
      "admin123!",
      "ADMIN"
    );

    await createUserIfMissing(
      "cadet@keel.com",
      "Cadet User",
      "cadet123",
      "CADET"
    );

    await createUserIfMissing(
      "master@keel.com",
      "Master User",
      "master123",
      "MASTER"
    );

    console.log("🌱 User seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedUsers();
