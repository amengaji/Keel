import sequelize from "../config/database.js";

async function emergencyDbFix() {
  try {
    console.log("⏳ Connecting to Database...");
    await sequelize.authenticate();
    console.log("✅ Connected.");

    // 1. Drop the View that is blocking the update
    console.log("🔥 Dropping blocking view...");
    await sequelize.query("DROP VIEW IF EXISTS public.admin_trb_cadets_v CASCADE;");

    // 2. Create the missing 'task_templates' table
    console.log("🛠  Creating 'task_templates' table...");
    await sequelize.query(\
      CREATE TABLE IF NOT EXISTS "task_templates" (
        "id" SERIAL,
        "part_number" INTEGER NOT NULL,
        "section_name" VARCHAR(200),
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "stcw_reference" VARCHAR(200),
        "mandatory_for_all" BOOLEAN DEFAULT false,
        "ship_type_id" INTEGER REFERENCES "ship_types" ("id"),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id"),
        UNIQUE ("title", "ship_type_id")
      );
    \);

    // 3. Fix 'cadet_vessel_assignments' (Handle column type change safely)
    console.log("🛠  Updating 'cadet_vessel_assignments'...");
    // We attempt to cast start_date to DATE. If it's already compatible, this works.
    await sequelize.query(\
      ALTER TABLE "cadet_vessel_assignments" 
      ALTER COLUMN "start_date" TYPE DATE USING "start_date"::DATE;
    \);
    // Ensure it's not null (as per model definition)
    // Wrapped in try/catch in case data violates it, but usually safe for new dev DB
    try {
      await sequelize.query('ALTER TABLE "cadet_vessel_assignments" ALTER COLUMN "start_date" SET NOT NULL;');
    } catch (e) { console.warn("  ⚠ Could not set start_date NOT NULL (data might exist). Skipping constraint."); }


    // 4. Recreate the View
    console.log("🔄 Recreating 'admin_trb_cadets_v' view...");
    await sequelize.query(\
      CREATE OR REPLACE VIEW public.admin_trb_cadets_v AS
      SELECT
        cva.id                                    AS assignment_id,
        u.id                                      AS cadet_id,
        u.email                                   AS cadet_email,
        u.full_name                               AS cadet_name,
        v.id                                      AS vessel_id,
        v.name                                    AS vessel_name,
        st.name                                   AS ship_type_name,
        cva.start_date                            AS assignment_start_date,
        cva.end_date                              AS assignment_end_date,
        
        COALESCE(COUNT(DISTINCT cfs.task_id), 0)  AS total_tasks,
        COALESCE(COUNT(DISTINCT
          CASE
            WHEN cfs.status = 'MASTER_APPROVED'
            THEN cfs.task_id
            ELSE NULL
          END
        ), 0)                                     AS tasks_master_approved,
        
        CASE
          WHEN COUNT(DISTINCT cfs.task_id) = 0 THEN 0
          ELSE ROUND(
            COUNT(DISTINCT
              CASE
                WHEN cfs.status = 'MASTER_APPROVED'
                THEN cfs.task_id
              END
            )::numeric
            / COUNT(DISTINCT cfs.task_id)::numeric * 100,
            2
          )
        END                                       AS completion_percentage,
        
        MAX(cfs."updatedAt")                      AS last_activity_at,
        
        CASE
          WHEN v.id IS NULL THEN 'Unassigned'
          WHEN COUNT(DISTINCT cfs.task_id) = 0 THEN 'Not Started'
          WHEN COUNT(DISTINCT cfs.task_id) =
               COUNT(DISTINCT
                 CASE
                   WHEN cfs.status = 'MASTER_APPROVED'
                   THEN cfs.task_id
                 END
               )
          THEN 'Completed'
          ELSE 'In Progress'
        END                                       AS overall_status

      FROM users u
      JOIN roles r ON u.role_id = r.id AND r.role_name = 'CADET'
      LEFT JOIN cadet_vessel_assignments cva 
        ON cva.cadet_id = u.id 
        AND cva.end_date IS NULL
      LEFT JOIN vessels v ON v.id = cva.vessel_id
      LEFT JOIN ship_types st ON st.id = v.ship_type_id
      LEFT JOIN cadet_familiarisation_state cfs
        ON cfs.cadet_id = u.id
       AND cfs.vessel_id = v.id
      GROUP BY
        cva.id,
        u.id,
        u.email,
        u.full_name,
        v.id,
        v.name,
        st.name,
        cva.start_date,
        cva.end_date
      ORDER BY u.full_name ASC;
    \);

    console.log("✅ DATABASE REPAIRED SUCCESSFULLY.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Fix Failed:", err);
    process.exit(1);
  }
}

emergencyDbFix();
