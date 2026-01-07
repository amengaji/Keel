-- ============================================================================
-- Migration: Fix cadet_profiles schema drift
-- Purpose  : Add missing columns safely (NO data loss)
-- Phase    : 2 (audit-safe)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Link to users table
-- ---------------------------------------------------------------------------
ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS user_id INTEGER;

ALTER TABLE cadet_profiles
ADD CONSTRAINT cadet_profiles_user_id_unique UNIQUE (user_id);

ALTER TABLE cadet_profiles
ADD CONSTRAINT cadet_profiles_user_id_fk
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Personal Information
-- ---------------------------------------------------------------------------
ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS nationality VARCHAR(80);

-- ---------------------------------------------------------------------------
-- Contact Information
-- ---------------------------------------------------------------------------
ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(120);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- ---------------------------------------------------------------------------
-- Maritime Identity
-- ---------------------------------------------------------------------------
ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS seaman_book_number VARCHAR(50);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS seaman_book_expiry_date DATE;

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS indos_number VARCHAR(50);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS indos_expiry_date DATE;

-- ---------------------------------------------------------------------------
-- Training Metadata
-- ---------------------------------------------------------------------------
ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS trainee_type VARCHAR(50);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS rank_label VARCHAR(50);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS category VARCHAR(20);

ALTER TABLE cadet_profiles
ADD COLUMN IF NOT EXISTS trb_applicable BOOLEAN DEFAULT TRUE;

-- ---------------------------------------------------------------------------
-- Indexes (safe if re-run)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cadet_profiles_user_id
ON cadet_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_passport
ON cadet_profiles(passport_number);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_seaman_book
ON cadet_profiles(seaman_book_number);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_indos
ON cadet_profiles(indos_number);
