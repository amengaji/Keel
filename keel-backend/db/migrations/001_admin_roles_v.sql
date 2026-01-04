-- KEEL DATABASE MIGRATION
-- File: 001_admin_roles_v.sql
-- Purpose: Read-only role registry for Shore Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - This view exposes system roles in a stable, audit-safe manner
-- - No ownership clauses (environment-specific)
-- - Used by Admin > Users & Roles screen

DROP VIEW IF EXISTS public.admin_roles_v;

CREATE VIEW public.admin_roles_v AS
SELECT
  id AS role_id,
  role_name
FROM roles
ORDER BY role_name;
