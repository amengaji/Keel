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

export const CADET_IMPORT_HEADERS = [
  { key: "full_name", label: "Full Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "gender", label: "Gender", required: false },
  { key: "nationality", label: "Nationality", required: false },
  { key: "date_of_birth", label: "DOB", required: false },
  { key: "phone_number", label: "Mobile", required: false },
  { key: "address_line_1", label: "Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "country", label: "Country", required: false },
  { key: "postal_code", label: "Postal Code", required: false },
  { key: "passport_number", label: "Passport No", required: false },
  { key: "passport_country", label: "Passport Country", required: false },
  { key: "passport_expiry_date", label: "Passport Expiry", required: false },
  { key: "seaman_book_number", label: "Seaman Book No", required: false },
  { key: "seaman_book_country", label: "Seaman Book Country", required: false },
  { key: "emergency_contact_name", label: "Emergency Contact", required: false },
  { key: "emergency_contact_relation", label: "Relation", required: false },
  { key: "emergency_contact_phone", label: "Emergency Phone", required: false }
];

export const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
