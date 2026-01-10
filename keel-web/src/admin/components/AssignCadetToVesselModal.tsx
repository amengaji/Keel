// keel-web/src/admin/components/AssignCadetToVesselModal.tsx
//
// Keel — Assign Cadet to Vessel Modal (Audit-Safe, Guarded)
// ---------------------------------------------------------
// PURPOSE:
// - Explicitly assign a Cadet to a Vessel
// - Read-only cadet identity
// - Guarded confirmation before write
//
// DESIGN PRINCIPLES:
// - No silent writes
// - One cadet → one vessel
// - Explicit confirmation
// - Operator confidence
//
// PHASE:
// - Phase 4A-2 (Assignment UX)
//

import { useEffect, useState } from "react";
import { X, Ship, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AssignCadetToVesselModalProps {
  open: boolean;
  cadet: {
    id: number;
    name: string;
    email: string;
  } | null;

  onClose: () => void;

  /**
   * Called after successful assignment
   * Parent should refresh cadet list + assignment map
   */
  onSuccess: () => Promise<void>;
}

interface ApiVesselOption {
  vessel_id: number;
  vessel_name: string;
  imo_number: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AssignCadetToVesselModal({
  open,
  cadet,
  onClose,
  onSuccess,
}: AssignCadetToVesselModalProps) {
  /* ------------------------------ Local State ------------------------------ */

  const [vessels, setVessels] = useState<ApiVesselOption[]>([]);
  const [loadingVessels, setLoadingVessels] = useState(false);

  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------ Lifecycle ------------------------------ */

  useEffect(() => {
    if (!open) {
      // Reset modal state on close
      setSelectedVesselId(null);
      setConfirming(false);
      setSubmitting(false);
      return;
    }

    // Load vessels only when modal opens
    loadVessels();
  }, [open]);

  /* ------------------------------ Data Load ------------------------------ */

  async function loadVessels() {
    try {
      setLoadingVessels(true);

      const res = await fetch("/api/v1/admin/vessels", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load vessels (${res.status})`);
      }

      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];

      const options: ApiVesselOption[] = rows.map((v: any) => ({
        vessel_id: Number(v.vessel_id ?? v.id),
        vessel_name: v.vessel_name ?? v.name ?? "Unnamed Vessel",
        imo_number: v.imo_number ?? v.imo ?? "",
      }));

      setVessels(options);
    } catch (err: any) {
      console.error("❌ Failed to load vessels:", err);
      toast.error(err?.message || "Unable to load vessels");
      setVessels([]);
    } finally {
      setLoadingVessels(false);
    }
  }

  /* ------------------------------ Submit ------------------------------ */

  async function handleConfirmAssignment() {
    if (!cadet || !selectedVesselId) return;

    try {
      setSubmitting(true);

      const res = await fetch("/api/v1/admin/cadet-assignments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cadet_id: cadet.id,
          vessel_id: selectedVesselId,
        }),
      });

      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Assignment failed");
      }

      toast.success("Cadet assigned to vessel successfully");

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Cadet assignment failed:", err);
      toast.error(err?.message || "Unable to assign cadet to vessel");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------ Render Guard ------------------------------ */

  if (!open || !cadet) return null;

  /* -------------------------------------------------------------------------- */
  /* Render                                                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Ship size={16} />
            <h2 className="text-sm font-semibold">
              Assign Cadet to Vessel
            </h2>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[hsl(var(--muted))]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ============================ BODY ============================ */}
        <div className="p-4 space-y-4">
          {/* Cadet Identity (Read-Only) */}
          <div className="rounded-md border border-[hsl(var(--border))] p-3">
            <div className="text-sm font-medium">{cadet.name}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              {cadet.email}
            </div>
          </div>

          {/* Vessel Selector */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Select Vessel
            </label>

            <select
              value={selectedVesselId ?? ""}
              onChange={(e) =>
                setSelectedVesselId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={loadingVessels || submitting}
              className="
                w-full
                px-3 py-2
                rounded-md
                border border-[hsl(var(--border))]
                bg-[hsl(var(--card))]
                text-sm
                focus:ring-2 focus:ring-[hsl(var(--primary))]
              "
            >
              <option value="">
                {loadingVessels
                  ? "Loading vessels…"
                  : "Select a vessel"}
              </option>

              {vessels.map((v) => (
                <option key={v.vessel_id} value={v.vessel_id}>
                  {v.vessel_name}
                  {v.imo_number ? ` (${v.imo_number})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Confirmation Warning */}
          {selectedVesselId && !confirming && (
            <div className="flex items-start gap-2 text-xs text-yellow-800 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
              <AlertTriangle size={16} />
              <div>
                This action assigns the cadet to the selected vessel.
                This will be recorded for audit.
              </div>
            </div>
          )}

          {/* Confirm Button */}
          {selectedVesselId && (
            <button
              onClick={() => setConfirming(true)}
              disabled={confirming || submitting}
              className="
                w-full
                px-4 py-2
                rounded-md
                bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                hover:opacity-90
                disabled:opacity-60
              "
            >
              Proceed to Confirm
            </button>
          )}

          {/* Final Confirmation */}
          {confirming && (
            <button
              onClick={handleConfirmAssignment}
              disabled={submitting}
              className="
                w-full
                px-4 py-2
                rounded-md
                bg-emerald-600
                text-white
                hover:bg-emerald-500
                disabled:opacity-60
              "
            >
              {submitting ? "Assigning…" : "Confirm Assignment"}
            </button>
          )}
        </div>

        {/* ============================ FOOTER ============================ */}
        <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-xs text-[hsl(var(--muted-foreground))]">
          Assignment actions are audit-logged and cannot be silently reverted.
        </div>
      </div>
    </div>
  );
}
