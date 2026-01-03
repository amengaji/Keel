// keel-web/src/admin/pages/AdminVesselsPage.tsx
//
// Keel — Vessels (Read-Only Foundation)
// ----------------------------------------------------
// PURPOSE:
// - Authoritative vessel list for Shore / DPA / Admin
// - IMO-first, maritime-correct identity
// - Read-only (Phase 2) — no create/edit/delete
// - Future-ready for Training, Audit, and TRB linkage
//
// IMPORTANT:
// - UI/UX only (mock data)
// - No backend calls
// - No mutations
// - Safe for audits and demos
//
// NEXT PHASES (NOT IN THIS FILE):
// - Vessel create/edit
// - Cadet assignment
// - TRB & audit risk indicators (live)
// - Import from Excel / Fleet systems


import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ship, Filter, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Mock Vessel Data — READ ONLY                                                */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This is intentional mock data.
   Replace with API data in Phase 3 without changing UI structure.
*/
const vessels = [
  {
    id: "v1",
    imo: "IMO 9876543",
    name: "MV Ocean Pioneer",
    type: "Bulk Carrier",
    flag: "Panama",
    classSociety: "DNV",
    status: "Active",
    cadetsOnboard: 2,
    activeTRBs: 2,
  },
  {
    id: "v2",
    imo: "IMO 9123456",
    name: "MT Blue Horizon",
    type: "Oil Tanker",
    flag: "Marshall Islands",
    classSociety: "ABS",
    status: "Laid-up",
    cadetsOnboard: 0,
    activeTRBs: 0,
  },
  {
    id: "v3",
    imo: "IMO 9988776",
    name: "MV Eastern Light",
    type: "Container Ship",
    flag: "Singapore",
    classSociety: "ClassNK",
    status: "Active",
    cadetsOnboard: 1,
    activeTRBs: 1,
  },
];

/* -------------------------------------------------------------------------- */
/* Status Pill — small helper component                                        */
/* -------------------------------------------------------------------------- */
function StatusPill({ status }: { status: string }) {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "Active") {
    return (
      <span className={`${base} bg-green-500/10 text-green-600`}>
        Active
      </span>
    );
  }

  if (status === "Laid-up") {
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-600`}>
        Laid-up
      </span>
    );
  }

  return (
    <span className={`${base} bg-slate-500/10 text-slate-500`}>
      Unknown
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Audit Risk Helper (Mock, Read-Only)                                         */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This is a visual indicator only.
   Real audit scoring will come from backend later.
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

export function AdminVesselsPage() {

    const navigate = useNavigate();
    // ---------------- UI State (Read-only) ----------------
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "Active" | "Laid-up"
    >("ALL");

    // ---------------- Derived Vessel List ----------------
    const filteredVessels = useMemo(() => {
        return vessels.filter((v) => {
        const matchesSearch =
            v.imo.toLowerCase().includes(search.toLowerCase()) ||
            v.name.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" || v.status === statusFilter;

        return matchesSearch && matchesStatus;
        });
    }, [search, statusFilter]);

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

        {/* Info action — UX only */}
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
      </div>

      {/* ============================ FILTER BAR ============================ */}
      {/* NOTE:
          Filters are UI-only for now.
          Logic will be added once backend is wired.
      */}
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
  />

        {/* Status Filter (Segmented) */}
        <div className="flex items-center gap-1">
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
            >
                {status}
            </button>
            ))}
        </div>
        </div>


      {/* ============================ VESSEL TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">
                IMO / Vessel
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Flag
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Class
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Status
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Cadets
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Active TRBs
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Audit Risk
              </th>

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
                "
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
                  <AuditRiskBadge trbs={vessel.activeTRBs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This is a read-only fleet view. Editing, imports, and training
        linkage will be enabled in later phases.
      </p>
    </div>
  );
}
