-- ============================================================================
-- Migration: Create cadet_profiles
-- Purpose  : Store maritime identity & statutory data for cadets
-- Phase    : 2 (audit-safe, no soft delete yet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cadet_profiles (
    id                      SERIAL PRIMARY KEY,

    -- ------------------------------------------------------------------------
    -- Link to users table
    -- ------------------------------------------------------------------------
    user_id                 INTEGER NOT NULL UNIQUE
                             REFERENCES users(id)
                             ON DELETE CASCADE,

    -- ------------------------------------------------------------------------
    -- Personal Information
    -- ------------------------------------------------------------------------
    date_of_birth           DATE NOT NULL,
    gender                  VARCHAR(20),
    nationality             VARCHAR(80) NOT NULL,

    -- ------------------------------------------------------------------------
    -- Contact Information
    -- ------------------------------------------------------------------------
    phone_number            VARCHAR(30),
    emergency_contact_name  VARCHAR(120),
    emergency_contact_phone VARCHAR(30),

    address_line_1          VARCHAR(255),
    address_line_2          VARCHAR(255),
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    country                 VARCHAR(100),
    postal_code             VARCHAR(20),

    -- ------------------------------------------------------------------------
    -- Maritime Identity (Critical)
    -- ------------------------------------------------------------------------
    passport_number         VARCHAR(50) NOT NULL UNIQUE,
    passport_expiry_date    DATE,

    seaman_book_number      VARCHAR(50) NOT NULL UNIQUE,
    seaman_book_expiry_date DATE,

    indos_number            VARCHAR(50) UNIQUE,
    indos_expiry_date       DATE,

    -- ------------------------------------------------------------------------
    -- Training Metadata
    -- ------------------------------------------------------------------------
    trainee_type            VARCHAR(50) NOT NULL,
    rank_label              VARCHAR(50) NOT NULL,
    category                VARCHAR(20) NOT NULL,
    trb_applicable          BOOLEAN NOT NULL DEFAULT TRUE,

    -- ------------------------------------------------------------------------
    -- System Metadata
    -- ------------------------------------------------------------------------
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for admin search & audit
CREATE INDEX IF NOT EXISTS idx_cadet_profiles_user_id
    ON cadet_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_passport
    ON cadet_profiles(passport_number);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_seaman_book
    ON cadet_profiles(seaman_book_number);

CREATE INDEX IF NOT EXISTS idx_cadet_profiles_indos
    ON cadet_profiles(indos_number);
