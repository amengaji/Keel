import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root (adjusting path to reach root from src/scripts)
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔌 Connecting to database:', process.env.DB_NAME);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, 
  }
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');

    // 1. DROP VIEW
    console.log('🔥 Dropping blocking view...');
    await sequelize.query('DROP VIEW IF EXISTS public.admin_trb_cadets_v CASCADE;');

    // 2. CREATE TABLE
    console.log('🛠  Creating task_templates table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "task_templates" (
        "id" SERIAL,
        "part_number" INTEGER NOT NULL,
        "section_name" VARCHAR(200),
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "stcw_reference" VARCHAR(200),
        "mandatory_for_all" BOOLEAN DEFAULT false,
        "ship_type_id" INTEGER,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY ("id"),
        UNIQUE ("title", "ship_type_id")
      );
    `);

    // 3. ALTER COLUMN
    console.log('🛠  Fixing cadet_vessel_assignments...');
    await sequelize.query(`
      ALTER TABLE "cadet_vessel_assignments" 
      ALTER COLUMN "start_date" TYPE DATE USING "start_date"::DATE;
    `);
    
    // 4. RECREATE VIEW
    console.log('🔄 Recreating view...');
    await sequelize.query(`
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
    `);

    console.log('✅ DATABASE REPAIRED SUCCESSFULLY.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

run();
