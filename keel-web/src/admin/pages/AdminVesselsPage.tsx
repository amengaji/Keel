// keel-web/src/admin/pages/AdminVesselsPage.tsx
//
// Keel — Vessels (Backend Wired — Create Enabled via Modal)
// ---------------------------------------------------------
// PURPOSE:
// - Authoritative vessel list for Shore / DPA / Admin
// - IMO-first, maritime-correct identity (IMO is the vessel identity anchor)
// - Backend wired to /api/v1/admin/vessels (cookie auth)
//
// WHAT CHANGED IN THIS PHASE:
// - "Create Vessel" is enabled using VesselUpsertModal (Option A: Modal UX)
// - "Edit Vessel" is now enabled (pencil icon per row) using the SAME modal
// - Row click still opens vessel details page (except when clicking action icons)
// - "Delete Vessel" icon is now present per row (UX scaffold only; wiring later)
//
// IMPORTANT TECH NOTES:
// - Uses cookie-based auth (HttpOnly) → credentials: "include" is REQUIRED
// - Vite dev proxy handles routing to backend (:5000)
// - This file is intentionally defensive against backend schema evolution
//
// UX NOTE:
// - We use explicit Edit/Delete icons in an Actions column.
// - Clicking the row opens details; clicking icons MUST NOT navigate.
//

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ship, Filter, Info, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";


import {
  VesselUpsertModal,
  type VesselUpsertInitialData,
  type VesselUpsertMode,
} from "./VesselUpsertModal";

/* -------------------------------------------------------------------------- */
/* Types (Defensive)                                                          */
/* -------------------------------------------------------------------------- */
/**
 * Vessel row shape returned by backend.
 * We keep this defensive because backend fields may evolve during Track wiring.
 *
 * EXPECTED (typical):
 * - vessel_id (number)  -> from view: admin_vessels_v
 * - imo_number (string)
 * - vessel_name (string)
 * - ship_type_id (number)  -> IMPORTANT for edit modal
 * - ship_type_name (string)
 * - flag (string)
 * - classification_society (string) OR class_society (legacy UI field)
 *
 * NOTE:
 * We intentionally do NOT hard-fail if some fields are missing.
 */
type ApiVesselRow = {
  vessel_id?: number;
  id?: number | string;

  // IMO identity
  imo_number?: string;
  imo?: string;

  // Vessel name
  vessel_name?: string;
  name?: string;

  // Ship type taxonomy
  ship_type_id?: number;
  shipTypeId?: number;

  ship_type_name?: string;
  type_name?: string;
  type?: string;

  // Registry / class
  flag?: string;

  classification_society?: string;
  class_society?: string;
  classSociety?: string;

  // -------------------- NEW (FROM admin_vessels_v) --------------------
  // Soft delete signal
  is_active?: boolean;

  // Human-readable status derived in SQL view
  vessel_status?: string;
  // -------------------------------------------------------------------

  // Legacy / future compatibility
  status?: string;

  cadets_onboard?: number;
  cadetsOnboard?: number;

  active_trbs?: number;
  activeTRBs?: number;
};


/* -------------------------------------------------------------------------- */
/* UI Model                                                                    */
/* -------------------------------------------------------------------------- */
/**
 * UI model used by this page.
 * This keeps the UI stable even if backend field names differ.
 */
type VesselUiRow = {
  id: string; // canonical UI id (string)
  imo: string;
  name: string;

  // Ship type UI label
  type: string;

  // Ship type taxonomy ID (IMPORTANT for edit modal dropdown)
  shipTypeId: number | null;

  flag: string;
  classSociety: string;

  // Derived from backend admin_vessels_v
  status: "Active" | "Laid-up" | "Unknown" | "Archived";

  // Soft delete flag (audit-safe)
  isActive: boolean;

  cadetsOnboard: number;
  activeTRBs: number;
};


/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes status into a small known set so pills remain stable.
 * If backend later provides richer statuses, we can map them here.
 */
function normalizeStatus(raw?: string): "Active" | "Laid-up" | "Unknown" {
  const v = (raw ?? "").trim().toLowerCase();

  if (v === "active") return "Active";
  if (v === "laid-up" || v === "laidup" || v === "laid up") return "Laid-up";

  // Allow future backend values without breaking UI
  return "Unknown";
}

/**
 * Returns the first non-empty string from candidates.
 * This is key to "defensive wiring" while backend view fields evolve.
 */
function getString(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = (c ?? "").toString().trim();
    if (v) return v;
  }
  return "";
}

/**
 * Parses a candidate into a finite number. Returns null if invalid.
 * We use this for ship_type_id so Edit modal never opens with broken data.
 */
function getNumberOrNull(...candidates: Array<number | string | undefined | null>): number | null {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const n = typeof c === "number" ? c : Number(String(c));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Status Pill — small helper component                                        */
/* -------------------------------------------------------------------------- */
function StatusPill({ status }: { status: string }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "Active") {
    return (
      <span className={`${base} bg-green-500/10 text-green-600`}>Active</span>
    );
  }

  if (status === "Laid-up") {
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-600`}>Laid-up</span>
    );
  }

  if (status === "Archived") {
    return (
      <span className={`${base} bg-slate-500/10 text-slate-500`}>
        Archived
      </span>
    );
  }

  return (
    <span className={`${base} bg-slate-500/10 text-slate-500`}>Unknown</span>
  );
}


/* -------------------------------------------------------------------------- */
/* Audit Risk Helper (Mock, Read-Only)                                         */
/* -------------------------------------------------------------------------- */
/**
 * NOTE:
 * This remains a VISUAL placeholder until Admin TRB wiring is connected to vessel rows.
 * For now we infer risk from activeTRBs count (0/1/2+).
 */
function AuditRiskBadge({ trbs }: { trbs: number }) {
  if (trbs === 0) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
        High Risk
      </span>
    );
  }

  if (trbs === 1) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-600">
        Medium Risk
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
      Low Risk
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Row Actions (Edit / Delete)                                                 */
/* -------------------------------------------------------------------------- */
/**
 * Small icon button used inside table rows.
 * IMPORTANT:
 * - We must stop event propagation so row click does NOT trigger navigation.
 * - We keep a consistent hit area for touch/trackpad usability.
 */
function RowIconButton(props: {
  title: string;
  ariaLabel: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
  disabled?: boolean;
}) {
  const tone = props.tone ?? "neutral";
  const disabled = props.disabled === true;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        props.onClick(e);
      }}
      disabled={disabled}
      className={[
        "h-9 w-9 inline-flex items-center justify-center rounded-md border",
        "border-[hsl(var(--border))]",
        disabled
          ? "opacity-40 cursor-not-allowed pointer-events-none"
          : "hover:bg-[hsl(var(--muted))]",
        tone === "danger" ? "text-red-600" : "text-[hsl(var(--foreground))]",
      ].join(" ")}
      aria-label={props.ariaLabel}
      title={props.title}
    >
      {props.children}
    </button>
  );
}


/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselsPage() {
  const navigate = useNavigate();

  /* ====================================================================== */
  /* Backend state                                                           */
  /* ====================================================================== */
  const [rows, setRows] = useState<VesselUiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ====================================================================== */
  /* UI state                                                                 */
  /* ====================================================================== */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Laid-up">(
    "ALL"
  );

  /* ====================================================================== */
  /* Modal state (Create/Edit)                                                */
  /* ====================================================================== */
  /**
   * We use one modal for create + edit.
   * In this step:
   * - Create opens from "+ Create Vessel"
   * - Edit opens from pencil icon on each row
   */
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<VesselUpsertMode>("create");

  // Edit mode uses this to pre-fill the modal
  const [upsertInitialData, setUpsertInitialData] =
    useState<VesselUpsertInitialData | undefined>(undefined);


    // -------------------- Delete (Soft Delete) Modal State --------------------

    // Controls confirm delete modal visibility
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Vessel selected for deletion
    const [deleteTarget, setDeleteTarget] = useState<{
      id: string;
      name: string;
    } | null>(null);

    // Prevent double-submit while API is in progress
    const [deleting, setDeleting] = useState(false);



  /* ------------------------------------------------------------------------ */
  /* Data Load (Reusable)                                                     */
  /* ------------------------------------------------------------------------ */
  /**
   * Loads vessels from backend (admin route).
   *
   * EXPECTED API:
   *   GET /api/v1/admin/vessels
   *
   * IMPORTANT:
   * - Must include cookies (HttpOnly auth)
   * - Vite dev proxy handles routing to :5000 backend
   *
   * Why useCallback:
   * - So we can re-run loading after create/update/delete without duplicating code.
   */
  const loadVessels = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const res = await fetch("/api/v1/admin/vessels", {
        credentials: "include",
      });

      // If session expires, AuthGate will normally redirect.
      // But we still handle it gracefully in-page.
      if (!res.ok) {
        const message = `Unable to load vessels (HTTP ${res.status})`;
        throw new Error(message);
      }

      // Safe JSON parse (this endpoint should return JSON)
      const data = await res.json();

      const apiRows: ApiVesselRow[] = Array.isArray(data?.data) ? data.data : [];

      const uiRows: VesselUiRow[] = apiRows.map((r, idx) => {
        const idRaw = r.vessel_id ?? r.id ?? `row_${idx}`;
        const id = String(idRaw);

        // IMO is the vessel’s identity anchor in maritime operations
        const imo = getString(r.imo_number, r.imo, "IMO (Not set)");

        // Operational name used in shore + onboard comms
        const name = getString(r.vessel_name, r.name, "(Unnamed Vessel)");

        // Ship type taxonomy label (read-only)
        const type = getString(r.ship_type_name, r.type_name, r.type, "—");

        // Ship type taxonomy ID (needed for edit modal dropdown)
        // NOTE: If backend doesn't send it for some reason, we keep null and block edit.
        const shipTypeId = getNumberOrNull(r.ship_type_id, r.shipTypeId);

        const flag = getString(r.flag, "—");

        // Support multiple backend keys
        const classSociety = getString(
          r.classification_society,
          r.class_society,
          r.classSociety,
          "—"
        );

        // Backend now provides vessel_status + is_active from admin_vessels_v
        const isActive = r.is_active !== false;

        const status =
          r.vessel_status === "Archived"
            ? "Archived"
            : normalizeStatus(r.vessel_status ?? r.status);

        // These two are not wired to your assignment/TRB backend yet.
        // Keep 0 now so the UI is truthful (not fake).
        const cadetsOnboard = (r.cadets_onboard ?? r.cadetsOnboard ?? 0) as number;
        const activeTRBs = (r.active_trbs ?? r.activeTRBs ?? 0) as number;

      return {
        id,
        imo,
        name,
        type,
        shipTypeId,
        flag,
        classSociety,
        status,
        isActive,
        cadetsOnboard,
        activeTRBs,
      };

      });

      setRows(uiRows);
    } catch (err: any) {
      console.error("❌ Admin vessels load failed:", err);

      const msg = err?.message || "Unable to load vessels";
      setLoadError(msg);
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Initial load                                                             */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled) return;
      await loadVessels();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [loadVessels]);

  /* ------------------------------------------------------------------------ */
  /* Modal handlers                                                           */
  /* ------------------------------------------------------------------------ */
  /**
   * Opens the upsert modal in "create" mode.
   * We intentionally clear initialData so the form is clean.
   */
  function openCreateModal() {
    setUpsertMode("create");
    setUpsertInitialData(undefined);
    setUpsertOpen(true);
  }

  /**
   * Opens the upsert modal in "edit" mode (from pencil icon).
   * We pre-fill the fields we have available in the vessels list.
   *
   * IMPORTANT:
   * - shipTypeId MUST be present, otherwise the dropdown cannot preselect correctly.
   * - If shipTypeId is missing, we block edit and show a toast (defensive UX).
   */
  function openEditModal(vessel: VesselUiRow) {
    if (!vessel?.id) {
      toast.error("Unable to edit vessel: missing vessel id");
      return;
    }

    if (vessel.shipTypeId === null) {
      toast.error(
        "Unable to edit vessel: vessel type id missing. Please refresh and try again."
      );
      return;
    }

    // Convert UI model to modal initial data shape
    const initial: VesselUpsertInitialData = {
      id: vessel.id,
      imo_number: vessel.imo === "IMO (Not set)" ? "" : vessel.imo,
      name: vessel.name === "(Unnamed Vessel)" ? "" : vessel.name,
      ship_type_id: vessel.shipTypeId,
      flag: vessel.flag === "—" ? "" : vessel.flag,
      classification_society: vessel.classSociety === "—" ? "" : vessel.classSociety,
    };

    setUpsertMode("edit");
    setUpsertInitialData(initial);
    setUpsertOpen(true);
  }

    /**
     * Opens confirm delete modal for the selected vessel.
     * NOTE:
     * - Actual delete happens only after explicit confirmation.
     * - This is audit-safe soft delete.
     */
    function requestDeleteVessel(vessel: VesselUiRow) {
      if (!vessel?.id) {
        toast.error("Unable to delete vessel: missing vessel id");
        return;
      }

      setDeleteTarget({
        id: vessel.id,
        name: vessel.name,
      });

      setDeleteOpen(true);
    }

    /**
     * Performs SOFT DELETE via backend.
     * Endpoint:
     *   DELETE /api/v1/admin/vessels/:id
     */
    async function confirmDeleteVessel() {
      if (!deleteTarget) return;

      try {
        setDeleting(true);

        const res = await fetch(
          `/api/v1/admin/vessels/${deleteTarget.id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const json = await res.json();

        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "Failed to delete vessel");
        }

        toast.success(`Vessel "${deleteTarget.name}" deleted successfully`);

        // Close modal
        setDeleteOpen(false);
        setDeleteTarget(null);

        // Refresh list so UI reflects truth
        await loadVessels();
      } catch (err: any) {
        console.error("❌ Vessel delete failed:", err);
        toast.error(err?.message || "Unable to delete vessel");
      } finally {
        setDeleting(false);
      }
    }



  /**
   * Closes the modal safely.
   * Keeping this as a helper makes future edits easier.
   */
  function closeUpsertModal() {
    setUpsertOpen(false);
  }

  /* ------------------------------------------------------------------------ */
  /* Derived Vessel List (Search + Status)                                    */
  /* ------------------------------------------------------------------------ */
  const filteredVessels = useMemo(() => {
    return rows.filter((v) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s || v.imo.toLowerCase().includes(s) || v.name.toLowerCase().includes(s);

      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Ship size={20} />
            Vessels
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Fleet overview for training, compliance, and audit readiness.
          </p>
        </div>

        {/* Info action (UX-only helper) */}
        <button
          onClick={() => toast.message("Vessel management will expand in Phase 3")}
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="Vessel information"
          title="About vessels module"
        >
          <Info size={18} />
        </button>

        {/* Create Vessel (modal-based) */}
        <button
          onClick={openCreateModal}
          className="
            px-4 py-2
            rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
          "
          aria-label="Create vessel"
          title="Create Vessel"
        >
          + Create Vessel
        </button>
      </div>

      {/* ============================ FILTER BAR ============================ */}
      <div
        className="
          flex flex-wrap items-center gap-4
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          px-4 py-3
        "
      >
        <Filter size={16} />

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search IMO or vessel name"
          className="
            px-3 py-2 rounded-md
            border border-[hsl(var(--border))]
            bg-transparent
            text-sm
            outline-none
            focus:ring-2 focus:ring-[hsl(var(--primary))]
          "
          aria-label="Search vessels"
        />

        {/* Status Filter (Segmented) */}
        <div className="flex items-center gap-1" aria-label="Status filter">
          {["ALL", "Active", "Laid-up"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as "ALL" | "Active" | "Laid-up")}
              className={[
                "px-3 py-1.5 rounded-md text-sm border",
                statusFilter === status
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              ].join(" ")}
              aria-label={`Filter ${status}`}
              title={`Filter ${status}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Refresh button (small, optional UX) */}
        <button
          onClick={loadVessels}
          className="
            ml-auto
            px-3 py-1.5
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
            text-sm
          "
          aria-label="Refresh vessels"
          title="Refresh vessels list"
        >
          Refresh
        </button>
      </div>

      {/* ============================ DATA STATES ============================ */}
      {loading && (
        <div
          className="
            rounded-lg
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
            p-4
            text-sm
            text-[hsl(var(--muted-foreground))]
          "
        >
          Loading vessels…
        </div>
      )}

      {!loading && loadError && (
        <div
          className="
            rounded-lg
            border border-red-500/30
            bg-red-500/5
            p-4
            text-sm
            text-red-600
          "
        >
          {loadError}
        </div>
      )}

      {!loading && !loadError && rows.length === 0 && (
        <div
          className="
            rounded-lg
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
            p-4
            text-sm
            text-[hsl(var(--muted-foreground))]
          "
        >
          No vessels found for this company yet.
        </div>
      )}

      {/* ============================ VESSEL TABLE ============================ */}
      {!loading && !loadError && rows.length > 0 && (
        <div
          className="
            overflow-hidden
            rounded-lg
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
          "
        >
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">IMO / Vessel</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Flag</th>
                <th className="px-4 py-3 text-left font-medium">Class</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Cadets</th>
                <th className="px-4 py-3 text-center font-medium">Active TRBs</th>
                <th className="px-4 py-3 text-center font-medium">Audit Risk</th>

                {/* NEW: Actions column (Edit/Delete icons) */}
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredVessels.map((vessel) => (
              <tr
                key={vessel.id}
                onClick={() => {
                  if (!vessel.isActive) {
                    toast.message("Archived vessels cannot be opened");
                    return;
                  }
                  navigate(`/admin/vessels/${vessel.id}`);
                }}
                className={`
                  border-t border-[hsl(var(--border))]
                  ${vessel.isActive ? "hover:bg-[hsl(var(--muted))] cursor-pointer" : "opacity-60"}
                `}
                  aria-label={`Open vessel ${vessel.name}`}
                  title="Open vessel details"
                  >

                  {/* IMO + Name */}
                  <td className="px-4 py-3">
                    <div className="font-medium">{vessel.imo}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {vessel.name}
                    </div>
                  </td>

                  <td className="px-4 py-3">{vessel.type}</td>
                  <td className="px-4 py-3">{vessel.flag}</td>
                  <td className="px-4 py-3">{vessel.classSociety}</td>

                  <td className="px-4 py-3">
                    <StatusPill status={vessel.status} />
                  </td>

                  <td className="px-4 py-3 text-center">{vessel.cadetsOnboard}</td>

                  <td className="px-4 py-3 text-center">{vessel.activeTRBs}</td>

                  <td className="px-4 py-3 text-center">
                    <AuditRiskBadge trbs={vessel.activeTRBs} />
                  </td>

                  {/* NEW: Actions cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit (pencil) */}
                      <RowIconButton
                        title={
                          vessel.isActive
                            ? "Edit vessel"
                            : "Archived vessels cannot be edited"
                        }
                        ariaLabel={`Edit ${vessel.name}`}
                        disabled={!vessel.isActive}
                        onClick={() => openEditModal(vessel)}
                      >


                        <Pencil size={16} />
                      </RowIconButton>

                      {/* Delete (trash) — scaffold only in this step */}
                      <RowIconButton
                        title={
                          vessel.isActive
                            ? "Delete vessel"
                            : "Archived vessels cannot be deleted"
                        }
                        ariaLabel={`Delete ${vessel.name}`}
                        disabled={!vessel.isActive}
                        onClick={() => requestDeleteVessel(vessel)}
                        tone="danger"
                      >


                        <Trash2 size={16} />
                      </RowIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This fleet view is audit-safe. Create + Edit are enabled; soft-delete will be enabled next.
      </p>

      {/* ============================ UPSERT MODAL (Create/Edit) ============================ */}
      <VesselUpsertModal
        open={upsertOpen}
        mode={upsertMode}
        initialData={upsertInitialData}
        onClose={closeUpsertModal}
        onSuccess={async () => {
          // After successful create/update/delete, reload list from backend
          // so UI always reflects the truth.
          await loadVessels();
        }}
      />
      {/* ============================ CONFIRM DELETE MODAL ============================ */}
      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete Vessel"
        description={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.name}" from the fleet?`
            : ""
        }
        confirmLabel="Delete Vessel"
        loading={deleting}
        onCancel={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteVessel}
      />
    </div>
  );
}
