// keel-web/src/admin/pages/AdminVesselsPage.tsx
//
// Keel — Vessels (Backend Wired — Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Authoritative vessel list for Shore / DPA / Admin
// - IMO-first, maritime-correct identity
// - Read-only by design (audit-safe)
//
// IMPORTANT:
// - Uses cookie-based auth (HttpOnly)
// - credentials: "include" is REQUIRED
// - No create/edit/delete logic here
//
// UX NOTES:
// - Preserves your existing layout
// - Adds Loading / Empty / Error states
// - Keeps filters/search client-side
//
// NEXT PHASES (NOT IN THIS FILE):
// - Vessel create/edit workflow
// - Cadet assignment
// - Live TRB indicators from admin TRB views
// - Import from Excel

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ship, Filter, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Types (Defensive)                                                          */
/* -------------------------------------------------------------------------- */
/**
 * Vessel row shape returned by backend.
 * We keep this defensive because backend fields may evolve during Track wiring.
 *
 * EXPECTED (typical):
 * - vessel_id (number)
 * - imo_number or imo (string)
 * - vessel_name or name (string)
 * - ship_type_name or type_name (string)
 * - flag (string)
 * - class_society or classSociety (string)
 * - status (string)
 *
 * NOTE:
 * We intentionally do NOT hard-fail if some fields are missing.
 */
type ApiVesselRow = {
  vessel_id?: number;
  id?: number | string;

  imo_number?: string;
  imo?: string;

  vessel_name?: string;
  name?: string;

  ship_type_name?: string;
  type_name?: string;
  type?: string;

  flag?: string;

  class_society?: string;
  classSociety?: string;

  status?: string;

  // Future fields (may or may not exist yet)
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
  id: string;
  imo: string;
  name: string;
  type: string;
  flag: string;
  classSociety: string;
  status: "Active" | "Laid-up" | "Unknown";
  cadetsOnboard: number; // mock/0 until assignments wiring
  activeTRBs: number; // mock/0 until TRB wiring
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
function normalizeStatus(raw?: string): "Active" | "Laid-up" | "Unknown" {
  const v = (raw ?? "").trim().toLowerCase();

  if (v === "active") return "Active";
  if (v === "laid-up" || v === "laidup" || v === "laid up") return "Laid-up";

  // Allow future backend values without breaking UI
  return "Unknown";
}

function getString(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = (c ?? "").toString().trim();
    if (v) return v;
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/* Status Pill — small helper component                                        */
/* -------------------------------------------------------------------------- */
function StatusPill({ status }: { status: string }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "Active") {
    return <span className={`${base} bg-green-500/10 text-green-600`}>Active</span>;
  }

  if (status === "Laid-up") {
    return <span className={`${base} bg-yellow-500/10 text-yellow-600`}>Laid-up</span>;
  }

  return <span className={`${base} bg-slate-500/10 text-slate-500`}>Unknown</span>;
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
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselsPage() {
  const navigate = useNavigate();

  // ---------------- Backend state ----------------
  const [rows, setRows] = useState<VesselUiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---------------- UI State (Read-only) ----------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Laid-up">("ALL");

  /* ------------------------------------------------------------------------ */
  /* Data Load                                                                 */
  /* ------------------------------------------------------------------------ */
  /**
   * Loads vessels from backend (admin read-only route).
   *
   * EXPECTED API:
   *   GET /api/v1/admin/vessels
   *
   * IMPORTANT:
   * - Must include cookies (HttpOnly auth)
   * - Vite dev proxy handles routing to :5000 backend
   */
  useEffect(() => {
    let cancelled = false;

    async function loadVessels() {
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

        // Safe JSON parse (some endpoints might return empty; this one should return JSON)
        const data = await res.json();

        const apiRows: ApiVesselRow[] = Array.isArray(data?.data) ? data.data : [];

        const uiRows: VesselUiRow[] = apiRows.map((r, idx) => {
          const idRaw = r.vessel_id ?? r.id ?? `row_${idx}`;
          const id = String(idRaw);

          const imo = getString(r.imo_number, r.imo, "IMO (Not set)");
          const name = getString(r.vessel_name, r.name, "(Unnamed Vessel)");
          const type = getString(r.ship_type_name, r.type_name, r.type, "—");
          const flag = getString(r.flag, "—");
          const classSociety = getString(r.class_society, r.classSociety, "—");
          const status = normalizeStatus(r.status);

          // These two are not wired to your assignment/TRB backend yet.
          // Keep 0 now so the UI is truthful (not fake).
          const cadetsOnboard =
            (r.cadets_onboard ?? r.cadetsOnboard ?? 0) as number;

          const activeTRBs =
            (r.active_trbs ?? r.activeTRBs ?? 0) as number;

          return {
            id,
            imo,
            name,
            type,
            flag,
            classSociety,
            status,
            cadetsOnboard,
            activeTRBs,
          };
        });

        if (!cancelled) {
          setRows(uiRows);
        }
      } catch (err: any) {
        console.error("❌ Admin vessels load failed:", err);

        if (!cancelled) {
          const msg = err?.message || "Unable to load vessels";
          setLoadError(msg);
          toast.error(msg);
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVessels();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- Derived Vessel List ----------------
  const filteredVessels = useMemo(() => {
    return rows.filter((v) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s ||
        v.imo.toLowerCase().includes(s) ||
        v.name.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "ALL" || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

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

        {/* Info action */}
        <button
          onClick={() =>
            toast.message("Vessel management will expand in Phase 3")
          }
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

        {/* Create Vessel (NOT wired yet) */}
        <button
          onClick={() => {
            toast.message("Create Vessel will be enabled in the next phase.");
            // Keep navigation path intact for later activation
            // navigate("/admin/vessels/create");
          }}
          className="
            px-4 py-2
            rounded-md
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            hover:opacity-90
          "
          aria-label="Create vessel"
          title="Create Vessel (coming next)"
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
              onClick={() =>
                setStatusFilter(status as "ALL" | "Active" | "Laid-up")
              }
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
              </tr>
            </thead>

            <tbody>
              {filteredVessels.map((vessel) => (
                <tr
                  key={vessel.id}
                  onClick={() => navigate(`/admin/vessels/${vessel.id}`)}
                  className="
                    border-t border-[hsl(var(--border))]
                    hover:bg-[hsl(var(--muted))]
                    cursor-pointer
                  "
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

                  <td className="px-4 py-3 text-center">
                    {vessel.cadetsOnboard}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {vessel.activeTRBs}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <AuditRiskBadge trbs={vessel.activeTRBs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This is a read-only fleet view. Editing, imports, and training linkage will be enabled in later phases.
      </p>
    </div>
  );
}
