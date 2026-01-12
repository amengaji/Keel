DROP VIEW IF EXISTS public.admin_users_v;

CREATE VIEW public.admin_users_v AS
SELECT
  u.id            AS user_id,
  u.full_name     AS full_name,
  u.email         AS email,
  u.gender        AS gender,       -- ADDED
  u.nationality   AS nationality,  -- ADDED
  r.role_name     AS role_name,
  u.current_vessel_id,
  u."createdAt"   AS created_at,
  u."updatedAt"   AS updated_at
FROM users u
JOIN roles r ON r.id = u.role_id
ORDER BY u."createdAt" DESC;