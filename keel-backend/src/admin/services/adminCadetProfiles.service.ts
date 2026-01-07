// keel-backend/src/admin/services/adminCadetProfiles.service.ts
//
// PURPOSE:
// - Create / Update Cadet Profile (identity only)
// - Read Cadet Profile for prefill (identity only)
// - STRICTLY no training, no vessel, no TRB
//
// PHASE:
// - Phase 3A (Identity enrichment)
//
// SAFETY:
// - Audit-safe
// - No deletes
// - No cascading writes
//
// CRITICAL SCHEMA FACTS (cadet_profiles):
// - mobile_number is NOT NULL (authoritative contact field)
// - address_line1 is NOT NULL (note: no underscore)
// - passport_expiry is NOT NULL (note: not passport_expiry_date)
// - seamans_book_number + seamans_book_country are NOT NULL (note: "seamans_", not "seaman_")
// - emergency_contact_relation is NOT NULL
//
// UX CONTRACT (for now):
// - UI sends phone_number -> we map to DB mobile_number
// - UI currently uses address_line_1 -> we map to DB address_line1
// - UI may send passport_expiry_date -> we map to DB passport_expiry
//
// UNIQUE ENFORCEMENT (DB indexes):
// - cadet_profiles_uq_passport_number_norm
// - cadet_profiles_uq_seamans_book_number_norm
// - cadet_profiles_uq_indos_number_norm
//
// IMPORTANT:
// - When these uniqueness rules fail, Postgres throws error code 23505.
// - We translate those to clean, shore-admin friendly messages.
//

import sequelize from "../../config/database.js";

/* ======================================================================
 * INTERNAL TYPES / HELPERS (small, explicit, audit-safe)
 * ====================================================================== */

/**
 * Simple HTTP-aware error for controllers to set correct status codes.
 * We do NOT leak DB internals; only safe, user-facing messages.
 */
class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Convert an optional string to a normalized value for DB:
 * - undefined -> null
 * - empty/whitespace -> null
 * - otherwise trimmed string
 */
function normalizeText(input?: string): string | null {
  if (input === undefined) return null;
  const trimmed = String(input).trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Convert an optional boolean to normalized boolean or null (for patch updates).
 */
function normalizeBool(input?: boolean): boolean | null {
  if (input === undefined) return null;
  return Boolean(input);
}

/**
 * Require a text value (for INSERT only). Throws a clear error for UI toast.
 */
function requireText(fieldLabel: string, value: string | null) {
  if (!value) {
    throw new Error(`${fieldLabel} is required and cannot be empty`);
  }
}

/**
 * Require a date value (ISO date string recommended).
 * We only check presence here; DB enforces type.
 */
function requireDate(fieldLabel: string, value: string | null) {
  if (!value) {
    throw new Error(`${fieldLabel} is required and cannot be empty`);
  }
}

/**
 * Extract Postgres error details from Sequelize error shapes.
 * Sequelize may place pg error under:
 * - error.original
 * - error.parent
 */
function getPgErrorParts(err: any): {
  pgCode?: string;
  constraint?: string;
  detail?: string;
} {
  const original = err?.original ?? err?.parent ?? err;
  return {
    pgCode: original?.code,
    constraint: original?.constraint,
    detail: original?.detail,
  };
}

/**
 * Convert DB uniqueness violations into safe, user-friendly messages.
 * - 23505 = unique_violation in Postgres
 * - The index name appears as "constraint" in pg error.
 */
function translateUniqueViolation(err: any): HttpError | null {
  const { pgCode, constraint } = getPgErrorParts(err);

  if (pgCode !== "23505") return null;

  // Map by our known unique indexes (audit-safe, does not reveal other cadets)
  if (constraint === "cadet_profiles_uq_passport_number_norm") {
    return new HttpError(409, "Passport number already exists for another cadet");
  }
  if (constraint === "cadet_profiles_uq_seamans_book_number_norm") {
    return new HttpError(409, "Seaman book number already exists for another cadet");
  }
  if (constraint === "cadet_profiles_uq_indos_number_norm") {
    return new HttpError(409, "INDOS number already exists for another cadet");
  }

  // Fallback: still a uniqueness problem, but unknown constraint name
  return new HttpError(
    409,
    "A unique identity document number already exists for another cadet"
  );
}

/**
 * Verify that the given cadetId exists and is a CADET user.
 * This keeps Cadet Registry as USERS-based.
 */
async function verifyCadetUserOrThrow(cadetId: number, transaction?: any) {
  const [users] = await sequelize.query(
    `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = :cadetId
        AND r.role_name = 'CADET'
    `,
    {
      replacements: { cadetId },
      transaction,
    }
  );

  if ((users as any[]).length === 0) {
    throw new Error("Cadet not found or not a CADET role");
  }
}




/* ======================================================================
 * READ: GET CADET PROFILE (for Shore Admin form prefill)
 * ====================================================================== */

/**
 * Fetch cadet profile as a UI-friendly payload.
 * Returns null if profile does not exist yet.
 *
 * SECURITY / AUDIT:
 * - Read-only
 * - No side effects
 */
export async function getCadetProfile(cadetId: number) {
  // Step 1: verify cadet exists (users-based registry)
  await verifyCadetUserOrThrow(cadetId);

  // Step 2: load profile (may not exist yet)
  const [rows] = await sequelize.query(
    `
    SELECT
      cadet_id,

      date_of_birth,
      gender,
      nationality,

      mobile_number,
      alternate_phone,

      address_line1,
      address_line2,
      city,
      state,
      country,
      postal_code,

      passport_number,
      passport_country,
      passport_expiry,

      seamans_book_number,
      seamans_book_country,

      indos_number,
      sid_number,

      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,

      blood_group,

      trainee_type,
      rank_label,
      category,
      trb_applicable,

      created_at,
      updated_at
    FROM cadet_profiles
    WHERE cadet_id = :cadetId
    LIMIT 1
    `,
    { replacements: { cadetId } }
  );

  const row = (rows as any[])[0];
  if (!row) return null;

  // Step 3: map DB column names to the UI contract names your form will use
  // We return UI-friendly keys (underscore style) to avoid frontend confusion.
  return {
    cadet_id: row.cadet_id,

    date_of_birth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,

    // UI uses phone_number; DB authoritative is mobile_number
    phone_number: row.mobile_number,
    alternate_phone: row.alternate_phone,

    // UI tends to use address_line_1 / address_line_2; DB is address_line1/address_line2
    address_line_1: row.address_line1,
    address_line_2: row.address_line2,
    city: row.city,
    state: row.state,
    country: row.country,
    postal_code: row.postal_code,

    passport_number: row.passport_number,
    passport_country: row.passport_country,

    // UI may send passport_expiry_date; DB uses passport_expiry
    passport_expiry_date: row.passport_expiry,

    // UI commonly uses seaman_book_number; DB uses seamans_book_number
    seaman_book_number: row.seamans_book_number,
    seamans_book_country: row.seamans_book_country,

    indos_number: row.indos_number,
    sid_number: row.sid_number,

    emergency_contact_name: row.emergency_contact_name,
    emergency_contact_relation: row.emergency_contact_relation,
    emergency_contact_phone: row.emergency_contact_phone,

    blood_group: row.blood_group,

    trainee_type: row.trainee_type,
    rank_label: row.rank_label,
    category: row.category,
    trb_applicable: row.trb_applicable,

    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ======================================================================
 * CREATE OR UPDATE CADET PROFILE
 * ====================================================================== */

export async function upsertCadetProfile(
  cadetId: number,
  payload: {
    date_of_birth?: string;
    gender?: string;
    nationality?: string;

    // UI field name:
    phone_number?: string;

    // Emergency contact (DB has NOT NULL on name, relation, phone)
    emergency_contact_name?: string;
    emergency_contact_relation?: string;
    emergency_contact_phone?: string;

    // UI fields often use underscore version; DB wants address_line1 etc.
    address_line_1?: string;
    address_line_2?: string;

    // Some UIs may send these without underscores (support both)
    address_line1?: string;
    address_line2?: string;

    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;

    passport_number?: string;
    passport_country?: string;

    // UI might send either; DB requires passport_expiry
    passport_expiry?: string;
    passport_expiry_date?: string;

    // UI might send "seaman_book_number", DB requires "seamans_book_number"
    seaman_book_number?: string;
    seamans_book_number?: string;

    seaman_book_country?: string;
    seamans_book_country?: string;

    indos_number?: string;
    sid_number?: string;

    alternate_phone?: string;
    blood_group?: string;

    trainee_type?: string;
    rank_label?: string;
    category?: string;
    trb_applicable?: boolean;
  }
) {
  const transaction = await sequelize.transaction();

  try {
    /* --------------------------------------------------
     * STEP 1: VERIFY CADET EXISTS (USERS-BASED REGISTRY)
     * -------------------------------------------------- */
    await verifyCadetUserOrThrow(cadetId, transaction);

    /* --------------------------------------------------
     * STEP 2: CHECK IF PROFILE EXISTS (INSERT vs PATCH UPDATE)
     * - If profile exists: allow partial updates.
     * - If profile does NOT exist: require all NOT NULL fields.
     * -------------------------------------------------- */
    const [existingRows] = await sequelize.query(
      `
      SELECT cadet_id
      FROM cadet_profiles
      WHERE cadet_id = :cadetId
      LIMIT 1
      `,
      {
        replacements: { cadetId },
        transaction,
      }
    );

    const profileExists = (existingRows as any[]).length > 0;

    /* --------------------------------------------------
     * STEP 3: NORMALIZE INPUTS (do not overwrite with blanks)
     * -------------------------------------------------- */

    // Required in DB (NOT NULL): mobile_number
    const mobile_number = normalizeText(payload.phone_number);

    // Required in DB (NOT NULL): date_of_birth, nationality
    const date_of_birth = normalizeText(payload.date_of_birth);
    const nationality = normalizeText(payload.nationality);

    // Address: DB requires address_line1 (no underscore)
    const address_line1 =
      normalizeText(payload.address_line1) ?? normalizeText(payload.address_line_1);

    const address_line2 =
      normalizeText(payload.address_line2) ?? normalizeText(payload.address_line_2);

    // Location required in DB: city/state/country/postal_code
    const city = normalizeText(payload.city);
    const state = normalizeText(payload.state);
    const country = normalizeText(payload.country);
    const postal_code = normalizeText(payload.postal_code);

    // Passport required in DB: passport_number, passport_country, passport_expiry
    const passport_number = normalizeText(payload.passport_number);
    const passport_country = normalizeText(payload.passport_country);
    const passport_expiry =
      normalizeText(payload.passport_expiry) ?? normalizeText(payload.passport_expiry_date);

    // Seaman book required in DB: seamans_book_number, seamans_book_country
    const seamans_book_number =
      normalizeText(payload.seamans_book_number) ?? normalizeText(payload.seaman_book_number);

    const seamans_book_country =
      normalizeText(payload.seamans_book_country) ?? normalizeText(payload.seaman_book_country);

    // Emergency required in DB: name, relation, phone
    const emergency_contact_name = normalizeText(payload.emergency_contact_name);
    const emergency_contact_relation = normalizeText(payload.emergency_contact_relation);
    const emergency_contact_phone = normalizeText(payload.emergency_contact_phone);

    // Optional identity fields
    const gender = normalizeText(payload.gender);
    const indos_number = normalizeText(payload.indos_number);
    const sid_number = normalizeText(payload.sid_number);
    const alternate_phone = normalizeText(payload.alternate_phone);
    const blood_group = normalizeText(payload.blood_group);
    const trainee_type = normalizeText(payload.trainee_type);
    const rank_label = normalizeText(payload.rank_label);
    const category = normalizeText(payload.category);
    const trb_applicable = normalizeBool(payload.trb_applicable);

    /* --------------------------------------------------
     * STEP 4: INSERT VALIDATION (ONLY WHEN CREATING NEW PROFILE)
     * -------------------------------------------------- */
    if (!profileExists) {
      // These are NOT NULL in your DB schema.
      requireDate("Date of Birth", date_of_birth);
      requireText("Nationality", nationality);
      requireText("Mobile number", mobile_number);

      requireText("Address Line 1", address_line1);
      requireText("City", city);
      requireText("State", state);
      requireText("Country", country);
      requireText("Postal Code", postal_code);

      requireText("Passport Number", passport_number);
      requireText("Passport Country", passport_country);
      requireDate("Passport Expiry Date", passport_expiry);

      requireText("Seaman Book Number", seamans_book_number);
      requireText("Seaman Book Country", seamans_book_country);

      requireText("Emergency Contact Name", emergency_contact_name);
      requireText("Emergency Contact Relation", emergency_contact_relation);
      requireText("Emergency Contact Phone", emergency_contact_phone);
    }

    /* --------------------------------------------------
     * STEP 5: UPSERT
     *
     * KEY DETAIL:
     * - For PATCH updates, we must NOT overwrite required columns with NULL.
     * - Therefore, in DO UPDATE we use COALESCE(EXCLUDED.col, cadet_profiles.col)
     * -------------------------------------------------- */
    await sequelize.query(
      `
      INSERT INTO cadet_profiles (
        cadet_id,

        -- Required identity
        date_of_birth,
        nationality,
        mobile_number,

        -- Address/location required
        address_line1,
        address_line2,
        city,
        state,
        country,
        postal_code,

        -- Passport required
        passport_number,
        passport_country,
        passport_expiry,

        -- Seaman book required
        seamans_book_number,
        seamans_book_country,

        -- Emergency required
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_phone,

        -- Optional identity enrichment
        gender,
        indos_number,
        sid_number,
        alternate_phone,
        blood_group,

        -- UI taxonomy (optional)
        trainee_type,
        rank_label,
        category,
        trb_applicable,

        created_at,
        updated_at
      )
      VALUES (
        :cadet_id,

        :date_of_birth,
        :nationality,
        :mobile_number,

        :address_line1,
        :address_line2,
        :city,
        :state,
        :country,
        :postal_code,

        :passport_number,
        :passport_country,
        :passport_expiry,

        :seamans_book_number,
        :seamans_book_country,

        :emergency_contact_name,
        :emergency_contact_relation,
        :emergency_contact_phone,

        :gender,
        :indos_number,
        :sid_number,
        :alternate_phone,
        :blood_group,

        :trainee_type,
        :rank_label,
        :category,
        :trb_applicable,

        NOW(),
        NOW()
      )
      ON CONFLICT (cadet_id)
      DO UPDATE SET
        -- Required: do not overwrite existing values with NULL during patch update
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, cadet_profiles.date_of_birth),
        nationality = COALESCE(EXCLUDED.nationality, cadet_profiles.nationality),
        mobile_number = COALESCE(EXCLUDED.mobile_number, cadet_profiles.mobile_number),

        address_line1 = COALESCE(EXCLUDED.address_line1, cadet_profiles.address_line1),
        address_line2 = COALESCE(EXCLUDED.address_line2, cadet_profiles.address_line2),
        city = COALESCE(EXCLUDED.city, cadet_profiles.city),
        state = COALESCE(EXCLUDED.state, cadet_profiles.state),
        country = COALESCE(EXCLUDED.country, cadet_profiles.country),
        postal_code = COALESCE(EXCLUDED.postal_code, cadet_profiles.postal_code),

        passport_number = COALESCE(EXCLUDED.passport_number, cadet_profiles.passport_number),
        passport_country = COALESCE(EXCLUDED.passport_country, cadet_profiles.passport_country),
        passport_expiry = COALESCE(EXCLUDED.passport_expiry, cadet_profiles.passport_expiry),

        seamans_book_number = COALESCE(EXCLUDED.seamans_book_number, cadet_profiles.seamans_book_number),
        seamans_book_country = COALESCE(EXCLUDED.seamans_book_country, cadet_profiles.seamans_book_country),

        emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, cadet_profiles.emergency_contact_name),
        emergency_contact_relation = COALESCE(EXCLUDED.emergency_contact_relation, cadet_profiles.emergency_contact_relation),
        emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, cadet_profiles.emergency_contact_phone),

        -- Optional fields: safe to patch
        gender = COALESCE(EXCLUDED.gender, cadet_profiles.gender),
        indos_number = COALESCE(EXCLUDED.indos_number, cadet_profiles.indos_number),
        sid_number = COALESCE(EXCLUDED.sid_number, cadet_profiles.sid_number),
        alternate_phone = COALESCE(EXCLUDED.alternate_phone, cadet_profiles.alternate_phone),
        blood_group = COALESCE(EXCLUDED.blood_group, cadet_profiles.blood_group),

        trainee_type = COALESCE(EXCLUDED.trainee_type, cadet_profiles.trainee_type),
        rank_label = COALESCE(EXCLUDED.rank_label, cadet_profiles.rank_label),
        category = COALESCE(EXCLUDED.category, cadet_profiles.category),
        trb_applicable = COALESCE(EXCLUDED.trb_applicable, cadet_profiles.trb_applicable),

        updated_at = NOW()
      `,
      {
        replacements: {
          cadet_id: cadetId,

          // Required identity (may be null on PATCH update; COALESCE protects)
          date_of_birth,
          nationality,
          mobile_number,

          // Address/location
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,

          // Passport
          passport_number,
          passport_country,
          passport_expiry,

          // Seaman book
          seamans_book_number,
          seamans_book_country,

          // Emergency
          emergency_contact_name,
          emergency_contact_relation,
          emergency_contact_phone,

          // Optional
          gender,
          indos_number,
          sid_number,
          alternate_phone,
          blood_group,

          trainee_type,
          rank_label,
          category,
          trb_applicable,
        },
        transaction,
      }
    );

    await transaction.commit();

    return {
      message: profileExists
        ? "Cadet profile updated successfully"
        : "Cadet profile created successfully",
    };
  } catch (error: any) {
    // Always rollback first (audit-safe transaction handling)
    await transaction.rollback();

    // Translate unique violations into safe messages for UI toasts
    const uniqueFriendly = translateUniqueViolation(error);
    if (uniqueFriendly) {
      console.error(
        "❌ Failed to upsert cadet profile (unique violation):",
        uniqueFriendly.message
      );
      throw uniqueFriendly;
    }

    console.error("❌ Failed to upsert cadet profile:", error);
    throw error;
  }
}
