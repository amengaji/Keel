-- keel-backend/db/migrations/20260107_add_unique_cadet_profiles_docs.sql
--
-- PHASE: 3A (Identity enrichment hardening)
-- PURPOSE:
-- - Enforce uniqueness for key identity document numbers:
--   1) passport_number (required)
--   2) seamans_book_number (required)
--   3) indos_number (optional)
--
-- SAFETY:
-- - No deletes
-- - No updates
-- - Index-based enforcement only (audit-safe)
--
-- NOTES:
-- - Normalize values to reduce false duplicates caused by case/spacing:
--   lower(btrim(value))
-- - Treat empty strings as NULL via nullif(...,'') so:
--   - Uniqueness is enforced for real values
--   - Blank/empty legacy values do not break the migration
--
-- IMPORTANT:
-- - Postgres UNIQUE indexes allow multiple NULLs
-- - INDOS is nullable, so we use a partial unique index

BEGIN;

-- 1) Passport number uniqueness (normalized, empty -> NULL)
CREATE UNIQUE INDEX IF NOT EXISTS cadet_profiles_uq_passport_number_norm
ON public.cadet_profiles (lower(nullif(btrim(passport_number), '')));

-- 2) Seamans book number uniqueness (normalized, empty -> NULL)
CREATE UNIQUE INDEX IF NOT EXISTS cadet_profiles_uq_seamans_book_number_norm
ON public.cadet_profiles (lower(nullif(btrim(seamans_book_number), '')));

-- 3) INDOS number uniqueness (nullable; only index real values)
CREATE UNIQUE INDEX IF NOT EXISTS cadet_profiles_uq_indos_number_norm
ON public.cadet_profiles (lower(nullif(btrim(indos_number), '')))
WHERE indos_number IS NOT NULL AND btrim(indos_number) <> '';

COMMIT;