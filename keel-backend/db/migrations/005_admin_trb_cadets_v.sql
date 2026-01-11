-- KEEL DATABASE MIGRATION
-- File: 005_admin_trb_cadets_v.sql
-- Purpose: Cadet TRB overview for Admin UI
-- Safe to re-run: YES
--
-- FIXED: Now includes ALL cadets (even unassigned ones) via LEFT JOIN
-- Logic: Users (Role=CADET) -> Left Join Active Assignment (end_date IS NULL)

DROP VIEW IF EXISTS public.admin_trb_cadets_v;

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
  
  -- Task Counts (Handle NULLs for unassigned)
  COALESCE(COUNT(DISTINCT cfs.task_id), 0)  AS total_tasks,
  COALESCE(COUNT(DISTINCT
    CASE
      WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
      THEN cfs.task_id
      ELSE NULL
    END
  ), 0)                                     AS tasks_master_approved,
  
  -- Completion %
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
  
  -- Overall Status Logic
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
-- Get current active assignment (or NULL)
LEFT JOIN cadet_vessel_assignments cva 
  ON cva.cadet_id = u.id 
  AND cva.end_date IS NULL
LEFT JOIN vessels v ON v.id = cva.vessel_id
LEFT JOIN ship_types st ON st.id = v.ship_type_id
LEFT JOIN cadet_familiarisation_state cfs
  ON cfs.cadet_id = u.id
 AND cfs.vessel_id = v.id -- Only count tasks for the CURRENT vessel
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