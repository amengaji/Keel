-- KEEL DATABASE MIGRATION
-- File: 004_admin_vessels_v.sql
-- Purpose: Read-only vessel registry for Admin UI
-- Safe to re-run: YES
--
-- Notes:
-- - Used by Admin > Vessels screen
-- - Joins ship type for classification visibility
-- - No ownership clauses (environment-safe)

DROP VIEW IF EXISTS public.admin_vessels_v;

CREATE VIEW public.admin_vessels_v AS
SELECT
  v.id                     AS vessel_id,
  v.name                   AS vessel_name,
  v.imo_number,
  v.call_sign,
  v.mmsi,
  st.id                    AS ship_type_id,
  st.name                  AS ship_type_name,
  v.flag,
  v.port_of_registry,
  v.classification_society,
  v.builder,
  v.year_built,
  v.gross_tonnage,
  v.net_tonnage,
  v.deadweight_tonnage,
  v.length_overall_m,
  v.breadth_moulded_m,
  v.depth_m,
  v.draught_summer_m,
  v.main_engine_type,
  v.main_engine_model,
  v.main_engine_power_kw,
  v.service_speed_knots,
  v.owner_company,
  v.manager_company,
  v.operating_area,
  v.ice_class,
  v.last_drydock_date,
  v.next_drydock_date,
  v.last_special_survey_date,
  v.next_special_survey_date,
  v."createdAt"             AS created_at,
  v."updatedAt"             AS updated_at
FROM vessels v
JOIN ship_types st ON st.id = v.ship_type_id
ORDER BY v.name;
