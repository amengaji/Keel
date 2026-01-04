-- KEEL DATABASE MIGRATION
-- File: 007_admin_trb_task_evidence_v.sql
-- Purpose: Task evidence & attachments for Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - Read-only access to uploaded TRB evidence
-- - Ordered by upload time for audit trace

DROP VIEW IF EXISTS public.admin_trb_task_evidence_v;

CREATE VIEW public.admin_trb_task_evidence_v AS
SELECT
  cfa.id                     AS attachment_id,
  cfs.cadet_id,
  u.email                    AS cadet_email,
  cfs.vessel_id,
  v.name                     AS vessel_name,
  cfs.section_id,
  cfs.task_id,
  cfs.status                 AS task_status,
  cfa.file_name,
  cfa.file_url,
  cfa."createdAt"            AS uploaded_at
FROM cadet_familiarisation_attachments cfa
JOIN cadet_familiarisation_state cfs ON cfs.id = cfa.state_id
JOIN users u ON u.id = cfs.cadet_id
JOIN vessels v ON v.id = cfs.vessel_id
ORDER BY cfa."createdAt" DESC;
