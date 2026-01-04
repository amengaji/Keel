-- KEEL DATABASE MIGRATION
-- File: 006_admin_trb_section_progress_v.sql
-- Purpose: Section-level TRB progress for Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - Aggregated per cadet / vessel / section
-- - Used by Admin > TRB drill-down screens

DROP VIEW IF EXISTS public.admin_trb_section_progress_v;

CREATE VIEW public.admin_trb_section_progress_v AS
SELECT
  cfs.cadet_id,
  u.email                                  AS cadet_email,
  cfs.vessel_id,
  v.name                                  AS vessel_name,
  cfs.section_id,
  COUNT(DISTINCT cfs.task_id)              AS total_tasks,
  COUNT(DISTINCT
    CASE
      WHEN cfs.status = 'MASTER_APPROVED'::enum_cadet_familiarisation_state_status
      THEN cfs.task_id
      ELSE NULL
    END
  )                                        AS tasks_master_approved,
  MAX(cfs."updatedAt")                     AS last_updated_at
FROM cadet_familiarisation_state cfs
JOIN users u ON u.id = cfs.cadet_id
JOIN vessels v ON v.id = cfs.vessel_id
GROUP BY
  cfs.cadet_id,
  u.email,
  cfs.vessel_id,
  v.name,
  cfs.section_id
ORDER BY u.email, cfs.section_id;
