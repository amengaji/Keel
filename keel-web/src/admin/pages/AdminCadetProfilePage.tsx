// keel-web/src/admin/pages/AdminCadetProfilePage.tsx
//
// Keel — Cadet Profile (Identity Enrichment)
// ----------------------------------------------------
// PURPOSE:
// - Shore Admin identity-only profile form (Phase 3A)
// - Prefill via GET  /api/v1/admin/cadets/:cadetId/profile
// - Save via   POST /api/v1/admin/cadets/:cadetId/profile
//
// SAFETY:
// - Identity only. NO vessel, NO TRB, NO training writes.
// - Backend enforces required fields on first create.
// - Backend enforces unique docs (passport / seaman book / INDOS).
//
// UX:
// - Clear required sections
// - Big touch targets
// - Light/Dark compatible using existing HSL vars
// - Toasts for success and errors (incl. 409 uniqueness)
//
// NOTE:
// - Form uses UI-friendly keys:
//   phone_number, address_line_1, passport_expiry_date, seaman_book_number, etc.
// - Service will map these to the DB schema.
//

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, User2, IdCard, Phone, MapPin, ShieldAlert } from "lucide-react";

import { CheckboxBox } from "../../components/common/CheckboxBox";

type CadetProfile = {
  cadet_id: number;

  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;

  phone_number: string | null; // authoritative mobile number in UI
  alternate_phone: string | null;

  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;

  passport_number: string | null;
  passport_country: string | null;
  passport_expiry_date: string | null;

  seaman_book_number: string | null;
  seaman_book_country: string | null;

  indos_number: string | null;
  sid_number: string | null;

  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;

  blood_group: string | null;

  trainee_type: string | null;
  rank_label: string | null;
  category: string | null;
  trb_applicable: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
};

function asText(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/** trim + convert empty to null */
function normalize(v: string): string | null {
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">{label}</div>
        {required ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
            Required
          </span>
        ) : null}
      </div>
      {hint ? (
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {hint}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full
        rounded-md
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        px-3 py-2
        text-sm
        outline-none
        focus:ring-2 focus:ring-[hsl(var(--primary))]/40
      "
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full
        rounded-md
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        px-3 py-2
        text-sm
        outline-none
        focus:ring-2 focus:ring-[hsl(var(--primary))]/40
      "
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AdminCadetProfilePage() {
  const navigate = useNavigate();
  const { cadetId } = useParams();

  const cadetIdNum = useMemo(() => Number(cadetId), [cadetId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // If GET returns null => profile not created yet
  const [profileExists, setProfileExists] = useState(false);

  // Form state (UI keys)
  const [form, setForm] = useState<CadetProfile>({
    cadet_id: cadetIdNum,

    date_of_birth: null,
    gender: null,
    nationality: null,

    phone_number: null,
    alternate_phone: null,

    address_line_1: null,
    address_line_2: null,
    city: null,
    state: null,
    country: null,
    postal_code: null,

    passport_number: null,
    passport_country: null,
    passport_expiry_date: null,

    seaman_book_number: null,
    seaman_book_country: null,

    indos_number: null,
    sid_number: null,

    emergency_contact_name: null,
    emergency_contact_relation: null,
    emergency_contact_phone: null,

    blood_group: null,

    trainee_type: null,
    rank_label: null,
    category: null,
    trb_applicable: true,
  });

  /* ------------------------------ Load Profile ------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!cadetIdNum || Number.isNaN(cadetIdNum)) {
          throw new Error("Invalid cadet ID");
        }

        const res = await fetch(`/api/v1/admin/cadets/${cadetIdNum}/profile`, {
          credentials: "include",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.message || `Failed to load profile (${res.status})`);
        }

        const json = await res.json();
        const data: CadetProfile | null = json?.data ?? null;

        if (cancelled) return;

        if (!data) {
          // Profile not created yet => keep defaults, but mark as new
          setProfileExists(false);
          setForm((prev) => ({
            ...prev,
            cadet_id: cadetIdNum,
            trb_applicable: true,
          }));
        } else {
          setProfileExists(true);
          setForm({
            ...form,
            ...data,
            cadet_id: cadetIdNum,
            // ensure boolean is never undefined in UI
            trb_applicable: data.trb_applicable ?? true,
          });
        }
      } catch (err: any) {
        console.error("❌ Failed to load cadet profile:", err);
        toast.error(err?.message || "Unable to load cadet profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadetIdNum]);

  /* ------------------------------ Client Validation ------------------------------ */
  function validateForCreateIfNeeded(): string | null {
    // Backend is authoritative. This is only to reduce user frustration.
    if (profileExists) return null;

    const required: { label: string; value: string | null }[] = [
      { label: "Date of Birth", value: form.date_of_birth },
      { label: "Nationality", value: form.nationality },
      { label: "Mobile number", value: form.phone_number },

      { label: "Address Line 1", value: form.address_line_1 },
      { label: "City", value: form.city },
      { label: "State", value: form.state },
      { label: "Country", value: form.country },
      { label: "Postal Code", value: form.postal_code },

      { label: "Passport Number", value: form.passport_number },
      { label: "Passport Country", value: form.passport_country },
      { label: "Passport Expiry Date", value: form.passport_expiry_date },

      { label: "Seaman Book Number", value: form.seaman_book_number },
      { label: "Seaman Book Country", value: form.seaman_book_country },

      { label: "Emergency Contact Name", value: form.emergency_contact_name },
      { label: "Emergency Contact Relation", value: form.emergency_contact_relation },
      { label: "Emergency Contact Phone", value: form.emergency_contact_phone },
    ];

    const missing = required.find((r) => !r.value || String(r.value).trim().length === 0);
    if (missing) return `${missing.label} is required`;

    return null;
  }

  /* ------------------------------ Save ------------------------------ */

  async function save() {
    try {
      setSaving(true);

      const msg = validateForCreateIfNeeded();
      if (msg) {
        toast.error(msg);
        return;
      }

      // Build payload using UI keys expected by service.
      // IMPORTANT: we intentionally do NOT send empty strings (convert to null).
      const payload = {
        date_of_birth: normalize(asText(form.date_of_birth)),
        gender: normalize(asText(form.gender)),
        nationality: normalize(asText(form.nationality)),

        phone_number: normalize(asText(form.phone_number)),
        alternate_phone: normalize(asText(form.alternate_phone)),

        address_line_1: normalize(asText(form.address_line_1)),
        address_line_2: normalize(asText(form.address_line_2)),
        city: normalize(asText(form.city)),
        state: normalize(asText(form.state)),
        country: normalize(asText(form.country)),
        postal_code: normalize(asText(form.postal_code)),

        passport_number: normalize(asText(form.passport_number)),
        passport_country: normalize(asText(form.passport_country)),
        passport_expiry_date: normalize(asText(form.passport_expiry_date)),

        seaman_book_number: normalize(asText(form.seaman_book_number)),
        // Service supports both seamans_book_country and seaman_book_country.
        // We send seaman_book_country (UI-friendly).
        seaman_book_country: normalize(asText(form.seaman_book_country)),

        indos_number: normalize(asText(form.indos_number)),
        sid_number: normalize(asText(form.sid_number)),

        emergency_contact_name: normalize(asText(form.emergency_contact_name)),
        emergency_contact_relation: normalize(asText(form.emergency_contact_relation)),
        emergency_contact_phone: normalize(asText(form.emergency_contact_phone)),

        blood_group: normalize(asText(form.blood_group)),

        trainee_type: normalize(asText(form.trainee_type)),
        rank_label: normalize(asText(form.rank_label)),
        category: normalize(asText(form.category)),
        trb_applicable: Boolean(form.trb_applicable),
      };

      const res = await fetch(`/api/v1/admin/cadets/${cadetIdNum}/profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Save failed (${res.status})`);
      }

      toast.success(json?.message || "Cadet profile saved");

      // After first successful save, treat as existing profile.
      setProfileExists(true);

      // Refresh GET to ensure we show server-normalized values.
      // (Keeps UI consistent if server trims or defaults anything)
      const refresh = await fetch(`/api/v1/admin/cadets/${cadetIdNum}/profile`, {
        credentials: "include",
      });
      const refreshJson = await refresh.json().catch(() => null);
      const refreshed: CadetProfile | null = refreshJson?.data ?? null;
      if (refreshed) {
        setForm((prev) => ({
          ...prev,
          ...refreshed,
          trb_applicable: refreshed.trb_applicable ?? true,
        }));
      }
    } catch (err: any) {
      console.error("❌ Failed to save profile:", err);
      toast.error(err?.message || "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------ UI ------------------------------ */

  if (loading) {
    return (
      <div className="text-sm text-[hsl(var(--muted-foreground))]">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================ BACK ============================ */}
      <button
        onClick={() => navigate(`/admin/cadets/${cadetIdNum}`)}
        className="
          inline-flex items-center gap-2
          text-sm
          px-3 py-1.5
          rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
      >
        <ArrowLeft size={16} />
        Back to Cadet Overview
      </button>

      {/* ============================ HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <User2 size={20} />
            Cadet Identity Profile
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Identity enrichment (Phase 3A). This does not modify training progress or assignments.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
            disabled:opacity-60
          "
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {/* ============================ STATUS STRIP ============================ */}
      <div
        className="
          rounded-lg border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
          flex items-start gap-3
        "
      >
        <IdCard className="mt-0.5" size={18} />
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {profileExists ? "Profile exists" : "Profile not created yet"}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {profileExists
              ? "You may update any field. Blank fields will not overwrite existing values."
              : "On first create, the backend requires mandatory identity and document fields. Fill all required sections before saving."}
          </div>
        </div>
      </div>

      {/* ============================ SECTION: PERSONAL ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <User2 size={16} />
          Personal Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Date of Birth" required hint = "As per passport.">
            <Input
              type="date"
              value={asText(form.date_of_birth)}
              onChange={(v) => setForm((p) => ({ ...p, date_of_birth: v }))}
            />
          </Field>

          <Field label="Nationality" required hint="As per passport. Example: Indian">
            <Input
              value={asText(form.nationality)}
              onChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
              placeholder="Indian"
            />
          </Field>

          <Field label="Gender" hint="Optional (if collected)">
            <Select
              value={asText(form.gender)}
              onChange={(v) => setForm((p) => ({ ...p, gender: v || null }))}
              options={[
                { value: "", label: "— Select —" },
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
            />
          </Field>
        </div>
      </div>

      {/* ============================ SECTION: CONTACT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Phone size={16} />
          Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Mobile Number"
            required
            hint="Authoritative contact field. Include country code (example: +91-9876543210)"
          >
            <Input
              value={asText(form.phone_number)}
              onChange={(v) => setForm((p) => ({ ...p, phone_number: v }))}
              placeholder="+91-9876543210"
            />
          </Field>

          <Field label="Alternate Phone" hint="Optional">
            <Input
              value={asText(form.alternate_phone)}
              onChange={(v) => setForm((p) => ({ ...p, alternate_phone: v }))}
              placeholder="+91-9XXXXXXXXX"
            />
          </Field>
        </div>
      </div>

      {/* ============================ SECTION: ADDRESS ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <MapPin size={16} />
          Address (Residential)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Address Line 1" required hint="Mandatory">
            <Input
              value={asText(form.address_line_1)}
              onChange={(v) => setForm((p) => ({ ...p, address_line_1: v }))}
              placeholder="House / Street / Locality"
            />
          </Field>

          <Field label="Address Line 2" hint="Optional">
            <Input
              value={asText(form.address_line_2)}
              onChange={(v) => setForm((p) => ({ ...p, address_line_2: v }))}
              placeholder="Area / Landmark"
            />
          </Field>

          <Field label="City" required>
            <Input
              value={asText(form.city)}
              onChange={(v) => setForm((p) => ({ ...p, city: v }))}
              placeholder="Mumbai"
            />
          </Field>

          <Field label="State" required>
            <Input
              value={asText(form.state)}
              onChange={(v) => setForm((p) => ({ ...p, state: v }))}
              placeholder="Maharashtra"
            />
          </Field>

          <Field label="Country" required>
            <Input
              value={asText(form.country)}
              onChange={(v) => setForm((p) => ({ ...p, country: v }))}
              placeholder="India"
            />
          </Field>

          <Field label="Postal Code" required>
            <Input
              value={asText(form.postal_code)}
              onChange={(v) => setForm((p) => ({ ...p, postal_code: v }))}
              placeholder="400088"
            />
          </Field>
        </div>
      </div>

      {/* ============================ SECTION: DOCUMENTS ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-6">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <IdCard size={16} />
          Identity Documents (Unique Enforced)
        </h2>

        {/* Passport */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Passport</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Passport Number" required>
              <Input
                value={asText(form.passport_number)}
                onChange={(v) => setForm((p) => ({ ...p, passport_number: v }))}
                placeholder="N1234567"
              />
            </Field>

            <Field label="Passport Country" required hint="Issuing country (example: India)">
              <Input
                value={asText(form.passport_country)}
                onChange={(v) => setForm((p) => ({ ...p, passport_country: v }))}
                placeholder="India"
              />
            </Field>

            <Field label="Passport Expiry Date" required>
              <Input
                type="date"
                value={asText(form.passport_expiry_date)}
                onChange={(v) => setForm((p) => ({ ...p, passport_expiry_date: v }))}
              />
            </Field>
          </div>
        </div>

        {/* Seaman Book */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Seaman Book</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Seaman Book Number" required>
              <Input
                value={asText(form.seaman_book_number)}
                onChange={(v) => setForm((p) => ({ ...p, seaman_book_number: v }))}
                placeholder="SB987654"
              />
            </Field>

            <Field label="Seaman Book Country" required hint="Issuing country (example: India)">
              <Input
                value={asText(form.seaman_book_country)}
                onChange={(v) => setForm((p) => ({ ...p, seaman_book_country: v }))}
                placeholder="India"
              />
            </Field>

            <Field label="INDOS Number" hint="Optional (but unique if provided)">
              <Input
                value={asText(form.indos_number)}
                onChange={(v) => setForm((p) => ({ ...p, indos_number: v }))}
                placeholder="INDOS123456"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ============================ SECTION: EMERGENCY ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <ShieldAlert size={16} />
          Emergency Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Name" required>
            <Input
              value={asText(form.emergency_contact_name)}
              onChange={(v) => setForm((p) => ({ ...p, emergency_contact_name: v }))}
              placeholder="Full name"
            />
          </Field>

          <Field label="Relation" required hint="Example: Father / Mother / Brother / Spouse">
            <Input
              value={asText(form.emergency_contact_relation)}
              onChange={(v) => setForm((p) => ({ ...p, emergency_contact_relation: v }))}
              placeholder="Brother"
            />
          </Field>

          <Field label="Phone" required hint="Include country code">
            <Input
              value={asText(form.emergency_contact_phone)}
              onChange={(v) => setForm((p) => ({ ...p, emergency_contact_phone: v }))}
              placeholder="+91-9XXXXXXXXX"
            />
          </Field>
        </div>
      </div>

      {/* ============================ SECTION: CLASSIFICATION ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <IdCard size={16} />
          Cadet Classification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Trainee Type" hint="Example: DECK_CADET / ENGINE_CADET">
            <Input
              value={asText(form.trainee_type)}
              onChange={(v) => setForm((p) => ({ ...p, trainee_type: v }))}
              placeholder="DECK_CADET"
            />
          </Field>

          <Field label="Rank Label" hint="Example: Deck Cadet">
            <Input
              value={asText(form.rank_label)}
              onChange={(v) => setForm((p) => ({ ...p, rank_label: v }))}
              placeholder="Deck Cadet"
            />
          </Field>

          <Field label="Category" hint="Example: Cadet">
            <Input
              value={asText(form.category)}
              onChange={(v) => setForm((p) => ({ ...p, category: v }))}
              placeholder="Cadet"
            />
          </Field>
        </div>

                {/* TRB Applicable (Web UX: Checkbox only) */}
                {/* TRB Applicable (Web UX: Checkbox only) */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
          <CheckboxBox
            label={`TRB Applicable (${Boolean(form.trb_applicable) ? "Yes" : "No"})`}
            description="If unchecked, this cadet can be excluded from TRB workflows where permitted by policy."
            checked={Boolean(form.trb_applicable)}
            onChange={(next: boolean) =>
              setForm((p) => ({ ...p, trb_applicable: next }))
            }
          />
        </div>


      </div>

      {/* Bottom save (UX: no long scroll back) */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
            disabled:opacity-60
          "
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
