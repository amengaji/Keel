-- KEEL DATABASE MIGRATION
-- File: 003_admin_ship_types_v.sql
-- Purpose: Read-only ship type registry for Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - Used by Admin > Ship Types screen
-- - Provides canonical vessel classification
-- - No ownership clauses (environment-safe)

DROP VIEW IF EXISTS public.admin_ship_types_v;

CREATE VIEW public.admin_ship_types_v AS
SELECT
  st.id           AS ship_type_id,
  st.type_code    AS type_code,
  st.name         AS name,
  st.description  AS description,
  st."createdAt"  AS created_at,
  st."updatedAt"  AS updated_at
FROM ship_types st
ORDER BY st.name;
