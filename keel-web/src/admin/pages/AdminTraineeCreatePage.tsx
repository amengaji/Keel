// keel-web/src/admin/pages/AdminTraineeCreatePage.tsx
//
// Keel — Add Trainee (Unified Model)
// ----------------------------------------------------
// PURPOSE:
// - Create trainees across Cadet and Rating categories
// - Maritime-correct classification
// - Foundation for TRB, audit, and vessel assignment
//
// IMPORTANT:
// - Backend persistence ENABLED (Phase 3)
// - No vessel assignment here
// - Rank and TRB applicability are auto-derived
//

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Trainee Type Definitions (LOCKED)                                           */
/* -------------------------------------------------------------------------- */
type TraineeType =
  | "DECK_CADET"
  | "ENGINE_CADET"
  | "ETO_CADET"
  | "DECK_RATING"
  | "ENGINE_RATING";

/* -------------------------------------------------------------------------- */
/* Trainee Type Metadata (Derived Fields)                                      */
/* -------------------------------------------------------------------------- */
const TRAINEE_TYPE_META: Record<
  TraineeType,
  {
    label: string;
    rank: string;
    category: "Cadet" | "Rating";
    trbApplicable: boolean;
  }
> = {
  DECK_CADET: {
    label: "Deck Cadet",
    rank: "Deck Cadet",
    category: "Cadet",
    trbApplicable: true,
  },
  ENGINE_CADET: {
    label: "Engine Cadet",
    rank: "Engine Cadet",
    category: "Cadet",
    trbApplicable: true,
  },
  ETO_CADET: {
    label: "ETO Cadet",
    rank: "ETO Cadet",
    category: "Cadet",
    trbApplicable: true,
  },
  DECK_RATING: {
    label: "Deck Rating",
    rank: "Deck Rating",
    category: "Rating",
    trbApplicable: false,
  },
  ENGINE_RATING: {
    label: "Engine Rating",
    rank: "Engine Rating",
    category: "Rating",
    trbApplicable: false,
  },
};

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminTraineeCreatePage() {
  const navigate = useNavigate();

  /* ----------------------------- Local State ------------------------------ */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [traineeType, setTraineeType] = useState<TraineeType | "">("");
  const [nationality, setNationality] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const derived = traineeType ? TRAINEE_TYPE_META[traineeType] : null;

  /* ----------------------------- Submit Handler ---------------------------- */
async function handleCreateTrainee() {
  if (!fullName || !email || !traineeType) {
    toast.error("Full name, email and trainee type are required");
    return;
  }

  try {
    const res = await fetch("/api/v1/admin/trainees", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message);
    }

    toast.success("Trainee created successfully");
    navigate("/admin/cadets");
  } catch (err: any) {
    toast.error(err.message || "Unable to create trainee");
  }
}


  return (
    <div className="max-w-3xl space-y-6">
      {/* ============================ BACK NAV ============================ */}
      <button
        onClick={() => navigate("/admin/cadets")}
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
        Back to Cadets
      </button>

      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <UserPlus size={20} />
          Add Trainee
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Register a trainee for training, audit, and assignment workflows.
        </p>
      </div>

      {/* ============================ FORM ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-6
          space-y-4
        "
      >
        {/* Full Name */}
        <div>
          <label className="text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Anuj Mengaji"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--background))]
              text-[hsl(var(--foreground))]
              outline-none
            "
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anuj@example.com"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--background))]
              text-[hsl(var(--foreground))]
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]

            "
          />
        </div>

        {/* Trainee Type */}
        <div>
          <label className="text-sm font-medium">
            Trainee Type <span className="text-red-500">*</span>
          </label>
          <select
            value={traineeType}
            onChange={(e) =>
              setTraineeType(e.target.value as TraineeType)
            }
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--background))]
              text-[hsl(var(--foreground))]
              outline-none
            "
          >
            <option value="">Select trainee type</option>
            {Object.entries(TRAINEE_TYPE_META).map(
              ([key, meta]) => (
                <option
                  key={key}
                  value={key}
                  className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                >
                  {meta.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="text-sm font-medium">Nationality</label>
          <input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Indian"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--background))]
              text-[hsl(var(--foreground))]
              outline-none
            "
          />
        </div>

        {/* Derived Info */}
        <div
          className="
            rounded-md
            border border-dashed border-[hsl(var(--border))]
            bg-[hsl(var(--muted))]
            p-4
            space-y-2
          "
        >
          <div className="text-sm font-medium">Derived Information</div>

          <div className="text-sm flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">
              Rank
            </span>
            <span className="font-medium">
              {derived?.rank || "—"}
            </span>
          </div>

          <div className="text-sm flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">
              Category
            </span>
            <span className="font-medium">
              {derived?.category || "—"}
            </span>
          </div>

          <div className="text-sm flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">
              TRB Applicable
            </span>
            <span className="font-medium">
              {derived
                ? derived.trbApplicable
                  ? "Yes"
                  : "No"
                : "—"}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional internal notes"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--background))]
              text-[hsl(var(--foreground))]
              outline-none
              resize-none
            "
            rows={3}
          />
        </div>
      </div>

      {/* ============================ ACTIONS ============================ */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate("/admin/cadets")}
          className="
            px-4 py-2
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
        >
          Cancel
        </button>

        <button
          onClick={handleCreateTrainee}
          disabled={submitting}
          className="
            px-4 py-2
            rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
            disabled:opacity-60
          "
        >
          {submitting ? "Creating…" : "Create Trainee"}
        </button>
      </div>
    </div>
  );
}
