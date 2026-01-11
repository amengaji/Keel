import sequelize from "../config/database.js";
import TaskTemplate from "../models/TaskTemplate.js";
import CadetVesselAssignment from "../models/CadetVesselAssignment.js";

async function fixAndSync() {
  try {
    console.log("⏳ Connecting...");
    await sequelize.authenticate();

    console.log("🔥 Dropping blocking view (admin_trb_cadets_v)...");
    await sequelize.query("DROP VIEW IF EXISTS public.admin_trb_cadets_v CASCADE;");

    console.log("🛠  Syncing tables...");
    await TaskTemplate.sync({ alter: true });
    await CadetVesselAssignment.sync({ alter: true });

    console.log("🔄 Recreating view (admin_trb_cadets_v)...");
    await sequelize.query(\
      CREATE VIEW public.admin_trb_cadets_v AS
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
            WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
            THEN cfs.task_id
            ELSE NULL
          END
        ), 0)                                     AS tasks_master_approved,
        
        CASE
          WHEN COUNT(DISTINCT cfs.task_id) = 0 THEN 0
          ELSE ROUND(
            COUNT(DISTINCT
              CASE
                WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
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
                   WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
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

    console.log("✅ Database fixed and synced successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fix failed:", err);
    process.exit(1);
  }
}

fixAndSync();
