-- KEEL DATABASE MIGRATION
-- File: 009_cadet_profiles.sql
-- Purpose: Cadet identity + maritime documents (separate from users)
-- Safe to re-run: YES (drops table if exists)
--
-- IMPORTANT:
-- - Does NOT modify users table
-- - Does NOT modify TRB views
-- - Does NOT modify assignments
-- - Users remain the auth identity; this is cadet profile data only

BEGIN;

-- UUID support (needed for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.cadet_profiles;

CREATE TABLE public.cadet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 1:1 link to users
  cadet_id INTEGER NOT NULL UNIQUE
    REFERENCES public.users(id)
    ON DELETE CASCADE,

  -- Identity
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  nationality VARCHAR(100) NOT NULL,
  country_of_birth VARCHAR(100),
  place_of_birth VARCHAR(150),

  -- Contact
  mobile_number VARCHAR(30) NOT NULL,
  alternate_phone VARCHAR(30),

  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,

  -- Maritime documents
  passport_number VARCHAR(50) NOT NULL UNIQUE,
  passport_country VARCHAR(100) NOT NULL,
  passport_expiry DATE NOT NULL,

  seamans_book_number VARCHAR(50) NOT NULL UNIQUE,
  seamans_book_country VARCHAR(100) NOT NULL,

  indos_number VARCHAR(50) UNIQUE, -- optional but must be unique if present
  sid_number VARCHAR(50),

  -- Emergency
  emergency_contact_name VARCHAR(150) NOT NULL,
  emergency_contact_relation VARCHAR(50) NOT NULL,
  emergency_contact_phone VARCHAR(30) NOT NULL,

  blood_group VARCHAR(10),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful indexes (uniques already index, but cadet_id lookup is common)
CREATE INDEX IF NOT EXISTS idx_cadet_profiles_cadet_id ON public.cadet_profiles(cadet_id);

COMMIT;
