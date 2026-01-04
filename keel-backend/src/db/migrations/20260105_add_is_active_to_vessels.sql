-- src/db/migrations/20260105_add_is_active_to_vessels.sql
--
-- PURPOSE:
-- - Add soft-delete support for vessels
-- - is_active = true  -> active vessel
-- - is_active = false -> soft-deleted vessel
-- - Required for audit-safe admin delete operations
--

BEGIN;

-- Add column only if it does not already exist
ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for faster admin filtering
CREATE INDEX IF NOT EXISTS idx_vessels_is_active
ON vessels (is_active);

COMMIT;
