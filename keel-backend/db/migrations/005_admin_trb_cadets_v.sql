-- KEEL DATABASE MIGRATION
-- File: 005_admin_trb_cadets_v.sql
-- Purpose: Cadet TRB overview for Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - One row per cadet-vessel assignment
-- - Completion derived from MASTER-approved tasks
-- - Audit-safe aggregation

DROP VIEW IF EXISTS public.admin_trb_cadets_v;

CREATE VIEW public.admin_trb_cadets_v AS
SELECT
  cva.id                                    AS assignment_id,
  cva.cadet_id,
  u.email                                  AS cadet_email,
  v.id                                    AS vessel_id,
  v.name                                  AS vessel_name,
  st.name                                 AS ship_type_name,
  cva.start_date                           AS assignment_start_date,
  cva.end_date                             AS assignment_end_date,
  COUNT(DISTINCT cfs.task_id)              AS total_tasks,
  COUNT(DISTINCT
    CASE
      WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
      THEN cfs.task_id
      ELSE NULL
    END
  )                                        AS tasks_master_approved,
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
  END                                      AS completion_percentage,
  MAX(cfs."updatedAt")                     AS last_activity_at,
  CASE
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
  END                                      AS overall_status
FROM cadet_vessel_assignments cva
JOIN users u ON u.id = cva.cadet_id
JOIN vessels v ON v.id = cva.vessel_id
JOIN ship_types st ON st.id = v.ship_type_id
LEFT JOIN cadet_familiarisation_state cfs
  ON cfs.cadet_id = cva.cadet_id
 AND cfs.vessel_id = cva.vessel_id
GROUP BY
  cva.id,
  cva.cadet_id,
  u.email,
  v.id,
  v.name,
  st.name,
  cva.start_date,
  cva.end_date
ORDER BY u.email;
