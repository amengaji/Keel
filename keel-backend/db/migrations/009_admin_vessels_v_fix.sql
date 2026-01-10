CREATE OR REPLACE VIEW admin_vessels_v AS
SELECT
  v.id                     AS vessel_id,
  v.name                   AS vessel_name,
  v.imo_number,
  v.ship_type_id,
  st.name                  AS ship_type_name,
  v.flag,
  v.classification_society,

  /* audit-safe timestamps */
  v."createdAt"             AS created_at,
  v."updatedAt"             AS updated_at,

  /* soft-delete state */
  v.is_active,

  /* human-readable status */
  CASE
    WHEN v.is_active = false THEN 'Archived'
    ELSE 'Active'
  END                      AS vessel_status,

  /* cadets currently onboard */
  COALESCE(ca.cadets_onboard, 0) AS cadets_onboard,

  /* active TRBs = active assignments */
  COALESCE(tr.active_trbs, 0)    AS active_trbs

FROM vessels v
LEFT JOIN ship_types st
  ON st.id = v.ship_type_id

LEFT JOIN (
  SELECT
    vessel_id,
    COUNT(*) AS cadets_onboard
  FROM cadet_vessel_assignments
  WHERE status = 'ACTIVE'
  GROUP BY vessel_id
) ca ON ca.vessel_id = v.id

LEFT JOIN (
  SELECT
    vessel_id,
    COUNT(*) AS active_trbs
  FROM cadet_vessel_assignments
  WHERE status = 'ACTIVE'
  GROUP BY vessel_id
) tr ON tr.vessel_id = v.id

ORDER BY v.name ASC;
