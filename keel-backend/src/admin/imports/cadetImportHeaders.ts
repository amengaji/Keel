// PURPOSE:
// - Authoritative Excel header contract for Cadet Import
// - Used by preview engine only (NO DB writes)

export const REQUIRED_HEADERS = [
  // Identity
  "full_name",
  "email",
  "role",

  // Core profile
  "date_of_birth",
  "nationality",
  "phone_number",

  // Address
  "address_line_1",
  "city",
  "state",
  "country",
  "postal_code",

  // Passport
  "passport_number",
  "passport_country",
  "passport_expiry_date",

  // Seaman Book
  "seaman_book_number",
  "seaman_book_country",

  // Emergency
  "emergency_contact_name",
  "emergency_contact_relation",
  "emergency_contact_phone",
];

export const OPTIONAL_HEADERS = [
  "gender",
  "alternate_phone",
  "indos_number",
  "sid_number",
  "blood_group",
  "trainee_type",
  "rank_label",
  "category",
  "trb_applicable",
];

export const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
