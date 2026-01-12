DROP VIEW IF EXISTS public.admin_vessels_v CASCADE;

CREATE OR REPLACE VIEW public.admin_vessels_v AS
SELECT 
    v.id AS vessel_id,
    v.name AS vessel_name,
    v.imo_number,
    v.flag,
    v.classification_society,
    v.is_active,
    v.ship_type_id,
    st.name AS ship_type_name,
    -- Determine vessel status
    CASE 
        WHEN v.is_active = false THEN 'Inactive'
        ELSE 'Active'
    END AS vessel_status,
    -- Count cadets currently assigned to this vessel
    (SELECT COUNT(*) 
     FROM cadet_vessel_assignments cva 
     WHERE cva.vessel_id = v.id AND cva.end_date IS NULL) AS cadets_onboard,
    -- Count active Training Record Books (TRBs)
    (SELECT COUNT(DISTINCT cadet_id) 
     FROM cadet_vessel_assignments 
     WHERE vessel_id = v.id) AS active_trbs
FROM vessels v
LEFT JOIN ship_types st ON v.ship_type_id = st.id;