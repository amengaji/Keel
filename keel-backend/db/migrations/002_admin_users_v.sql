-- KEEL DATABASE MIGRATION
-- File: 002_admin_users_v.sql
-- Purpose: Read-only admin view of all system users
-- Safe to re-run: YES
--
-- Notes:
-- - Used by Admin > Users screen
-- - Exposes role, vessel context, and timestamps
-- - No mutation logic, audit-safe

DROP VIEW IF EXISTS public.admin_users_v;

CREATE VIEW public.admin_users_v AS
SELECT
  u.id            AS user_id,
  u.full_name     AS full_name,
  u.email         AS email,
  r.role_name     AS role_name,
  u.current_vessel_id,
  u."createdAt"   AS created_at,
  u."updatedAt"   AS updated_at
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY u."createdAt" DESC;
