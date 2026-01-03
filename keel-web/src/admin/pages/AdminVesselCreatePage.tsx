// keel-web/src/admin/pages/AdminVesselCreatePage.tsx
//
// Keel — Create Vessel (Phase 3 Foundation)
// ----------------------------------------------------
// PURPOSE:
// - Create a new vessel in the KEEL system
// - IMO-first maritime identity
// - Shore / DPA controlled operation
//
// IMPORTANT:
// - UI/UX only (no backend)
// - No persistence
// - Safe for demos and walkthroughs
// - Validation is UX-level only
//
// FUTURE PHASES (NOT IN THIS FILE):
// - Backend persistence
// - IMO checksum validation
// - Excel import
// - Vessel edit / archive

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Ship, ArrowLeft } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Vessel Type Options (Maritime-Correct)                                      */
/* -------------------------------------------------------------------------- */
const VESSEL_TYPES = [
  "Bulk Carrier",
  "Oil Tanker",
  "Chemical Tanker",
  "Product Tanker",
  "Gas Carrier",
  "Container Ship",
  "General Cargo",
  "Ro-Ro",
];

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselCreatePage() {
  const navigate = useNavigate();

  /* ----------------------------- Local State ------------------------------ */
  const [imo, setImo] = useState("");
  const [name, setName] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [flag, setFlag] = useState("");
  const [classSociety, setClassSociety] = useState("");

  /* ----------------------------- Submit Handler ---------------------------- */
  function handleCreateVessel() {
    // Basic UX validation only (backend will enforce later)
    if (!imo || !name || !vesselType) {
      toast.error("IMO, Vessel Name, and Vessel Type are required");
      return;
    }

    toast.success("Vessel created successfully (mock)");

    // Redirect back to vessels list
    navigate("/admin/vessels");
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* ============================ BACK NAV ============================ */}
      <button
        onClick={() => navigate("/admin/vessels")}
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
        Back to Vessels
      </button>

      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Ship size={20} />
          Create Vessel
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Register a vessel for training, compliance, and audit tracking.
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
        {/* IMO Number */}
        <div>
          <label className="text-sm font-medium">
            IMO Number <span className="text-red-500">*</span>
          </label>
          <input
            value={imo}
            onChange={(e) => setImo(e.target.value)}
            placeholder="IMO 9876543"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
          />
        </div>

        {/* Vessel Name */}
        <div>
          <label className="text-sm font-medium">
            Vessel Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MV Ocean Pioneer"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
          />
        </div>

        {/* Vessel Type */}
        <div>
          <label className="text-sm font-medium">
            Vessel Type <span className="text-red-500">*</span>
          </label>
          <select
            value={vesselType}
            onChange={(e) => setVesselType(e.target.value)}
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
          >
            <option value="">Select vessel type</option>
            {VESSEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Flag State */}
        <div>
          <label className="text-sm font-medium">Flag State</label>
          <input
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Panama"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
            "
          />
        </div>

        {/* Class Society */}
        <div>
          <label className="text-sm font-medium">Class Society</label>
          <input
            value={classSociety}
            onChange={(e) => setClassSociety(e.target.value)}
            placeholder="DNV, ABS, ClassNK"
            className="
              mt-1 w-full
              px-3 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
            "
          />
        </div>
      </div>

      {/* ============================ ACTIONS ============================ */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate("/admin/vessels")}
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
          onClick={handleCreateVessel}
          className="
            px-4 py-2
            rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
          "
        >
          Create Vessel
        </button>
      </div>
    </div>
  );
}
