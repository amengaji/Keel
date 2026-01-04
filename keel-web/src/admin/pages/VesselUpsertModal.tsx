// keel-web/src/admin/pages/VesselUpsertModal.tsx
//
// Keel — Vessel Create / Edit Modal (Phase 3)
// ----------------------------------------------------
// PURPOSE:
// - Single modal for Create + Edit Vessel
// - Create: IMO editable
// - Edit  : IMO read-only (backend enforced as well)
// - Vessel Type dropdown is READ-ONLY taxonomy (admin ship types)
// - Backend wired (POST / PUT)
// - Toast-friendly UX
//
// IMPORTANT:
// - Modal only (no routing)
// - Parent controls open/close + mode
// - Light / Dark mode compliant
//
// BACKEND DEPENDENCIES:
// - GET  /api/v1/admin/ship-types   (taxonomy, read-only)
// - POST /api/v1/admin/vessels
// - PUT  /api/v1/admin/vessels/:id
//

import { useEffect, useRef, useState } from "react";
import { X, Ship } from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type VesselUpsertMode = "create" | "edit";

export type VesselUpsertInitialData = {
  id?: string;
  imo_number?: string;
  name?: string;
  ship_type_id?: number;
  flag?: string;
  classification_society?: string;
};

type ShipTypeRow = {
  id: number;
  name: string;
};

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type VesselUpsertModalProps = {
  open: boolean;
  mode: VesselUpsertMode;
  initialData?: VesselUpsertInitialData;

  // Called after successful create/update
  onSuccess: () => void;

  // Close modal
  onClose: () => void;
};

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function VesselUpsertModal(props: VesselUpsertModalProps) {
  const { open, mode, initialData, onClose, onSuccess } = props;

  /* ----------------------------- Local State ------------------------------ */
  const [imo, setImo] = useState("");
  const [name, setName] = useState("");
  const [shipTypeId, setShipTypeId] = useState<number | "">("");
  const [flag, setFlag] = useState("");
  const [classSociety, setClassSociety] = useState("");
  // Guard to prevent create-mode form reset on every re-render
  const hasInitializedRef = useRef(false);

  const [saving, setSaving] = useState(false);

  // Ship types (taxonomy)
  const [shipTypes, setShipTypes] = useState<ShipTypeRow[]>([]);
  const [shipTypesLoading, setShipTypesLoading] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load Ship Types (READ-ONLY taxonomy)                                     */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadShipTypes() {
      try {
        setShipTypesLoading(true);

        const res = await fetch("/api/v1/admin/ship-types", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load vessel types (${res.status})`);
        }

        const json = await res.json();

        const rows: ShipTypeRow[] = Array.isArray(json?.data)
          ? json.data
          : [];

        if (!cancelled) {
          setShipTypes(rows);
        }
      } catch (err: any) {
        console.error("❌ Failed to load ship types:", err);
        toast.error(err?.message || "Unable to load vessel types");

        if (!cancelled) {
          setShipTypes([]);
        }
      } finally {
        if (!cancelled) {
          setShipTypesLoading(false);
        }
      }
    }

    loadShipTypes();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /* ------------------------------------------------------------------------ */
  /* Initialize form on open / mode change                                    */
  /* ------------------------------------------------------------------------ */
    useEffect(() => {
    if (!open) return;

    // EDIT MODE: always hydrate from initialData
    if (mode === "edit" && initialData) {
        setImo(initialData.imo_number ?? "");
        setName(initialData.name ?? "");
        setShipTypeId(initialData.ship_type_id ?? "");
        setFlag(initialData.flag ?? "");
        setClassSociety(initialData.classification_society ?? "");
        hasInitializedRef.current = true;
        return;
    }

    // CREATE MODE: reset ONLY ON FIRST OPEN
    if (mode === "create" && !hasInitializedRef.current) {
        setImo("");
        setName("");
        setShipTypeId("");
        setFlag("");
        setClassSociety("");
        hasInitializedRef.current = true;
    }
    }, [open, mode, initialData]);


  /* ------------------------------------------------------------------------ */
  /* Submit Handler                                                           */
  /* ------------------------------------------------------------------------ */
  async function handleSubmit() {
    if (!imo || !name || shipTypeId === "") {
      toast.error("IMO number, Vessel name, and Vessel type are required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        imo_number: imo,
        name,
        ship_type_id: shipTypeId,
        flag,
        classification_society: classSociety,
      };

      const url =
        mode === "create"
          ? "/api/v1/admin/vessels"
          : `/api/v1/admin/vessels/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Operation failed");
      }

      toast.success(
        mode === "create"
          ? "Vessel created successfully"
          : "Vessel updated successfully"
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save vessel");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render Guard                                                             */
  /* ------------------------------------------------------------------------ */
  if (!open) {
  hasInitializedRef.current = false;
  return null;
}


  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex items-center justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          w-full max-w-lg
          rounded-lg
          bg-[hsl(var(--card))]
          border border-[hsl(var(--border))]
          shadow-lg
        "
      >
        {/* ============================ HEADER ============================ */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Ship size={16} />
            {mode === "create" ? "Create Vessel" : "Edit Vessel"}
          </h2>

          <button
            onClick={onClose}
            className="
              h-8 w-8
              rounded-md
              flex items-center justify-center
              hover:bg-[hsl(var(--muted))]
            "
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ============================ BODY ============================ */}
        <div className="p-4 space-y-4">
          {/* IMO Number */}
          <div>
            <label className="text-sm font-medium">
              IMO Number <span className="text-red-500">*</span>
            </label>
            <input
              value={imo}
              onChange={(e) => setImo(e.target.value)}
              disabled={mode === "edit"}
              placeholder="IMO 9876543"
              className="
                mt-1 w-full px-3 py-2 rounded-md
                border border-[hsl(var(--border))]
                bg-transparent
                disabled:opacity-60
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
                mt-1 w-full px-3 py-2 rounded-md
                border border-[hsl(var(--border))]
                bg-transparent
              "
            />
          </div>

            {/* Vessel Type (READ-ONLY taxonomy) */}
            <div>
                <label className="text-sm font-medium">
                Vessel Type <span className="text-red-500">*</span>
                </label>
                <select
                value={shipTypeId}
                onChange={(e) => {
                    const val = e.target.value;
                    // If the user selects the placeholder, set empty string.
                    // Otherwise, convert the string ID back to a Number.
                    setShipTypeId(val === "" ? "" : Number(val));
                }}
                disabled={shipTypesLoading}
                className="
                    mt-1 w-full px-3 py-2 rounded-md
                    border border-[hsl(var(--border))]
                    bg-[hsl(var(--card))]
                    text-[hsl(var(--foreground))]
                    disabled:opacity-60
                "
                >
                <option value="" className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                    {shipTypesLoading ? "Loading vessel types..." : "Select vessel type"}
                </option>

                {shipTypes.map((t) => (
                    <option
                    key={t.id}
                    value={t.id}
                    className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
                    >
                    {t.name}
                    </option>
                ))}
                </select>
            </div>

          {/* Flag */}
          <div>
            <label className="text-sm font-medium">Flag State</label>
            <input
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Panama"
              className="
                mt-1 w-full px-3 py-2 rounded-md
                border border-[hsl(var(--border))]
                bg-transparent
              "
            />
          </div>

          {/* Class Society */}
          <div>
            <label className="text-sm font-medium">Class Society</label>
            <input
              value={classSociety}
              onChange={(e) => setClassSociety(e.target.value)}
              placeholder="DNV, ABS"
              className="
                mt-1 w-full px-3 py-2 rounded-md
                border border-[hsl(var(--border))]
                bg-transparent
              "
            />
          </div>
        </div>

        {/* ============================ FOOTER ============================ */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="
              px-4 py-2 rounded-md
              border border-[hsl(var(--border))]
              hover:bg-[hsl(var(--muted))]
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="
              px-4 py-2 rounded-md
              bg-[hsl(var(--primary))]
              text-[hsl(var(--primary-foreground))]
              hover:opacity-90
              disabled:opacity-60
            "
          >
            {saving
              ? "Saving…"
              : mode === "create"
              ? "Create Vessel"
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
