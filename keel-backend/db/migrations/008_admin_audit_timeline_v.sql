-- KEEL DATABASE MIGRATION
-- File: 008_admin_audit_timeline_v.sql
-- Purpose: Unified audit timeline for TRB lifecycle
-- Safe to re-run: YES
--
-- Notes:
-- - Chronological audit trail across cadet / CTO / Master
-- - Read-only, compliance-safe

DROP VIEW IF EXISTS public.admin_audit_timeline_v;

CREATE VIEW public.admin_audit_timeline_v AS
SELECT
  cfs.id                         AS state_id,
  u.id                           AS cadet_id,
  u.full_name                    AS cadet_name,
  r.role_name::varchar(50)       AS actor_role,
  v.name                         AS vessel_name,
  fst.section_code,
  ftt.task_code,
  'TASK_CREATED'::text           AS event_type,
  cfs."createdAt"                AS event_timestamp,
  NULL::text                     AS comment
FROM cadet_familiarisation_state cfs
JOIN users u ON u.id = cfs.cadet_id
JOIN roles r ON r.id = u.role_id
JOIN vessels v ON v.id = cfs.vessel_id
JOIN fam_section_templates fst ON fst.id = cfs.section_id
JOIN fam_task_templates ftt ON ftt.id = cfs.task_id;
