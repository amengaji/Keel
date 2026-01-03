// keel-web/src/admin/pages/AdminCadetsPage.tsx
//
// Keel — Cadets (Read-Only List)
// ----------------------------------------------------
// PURPOSE:
// - Authoritative cadet overview for Shore / DPA / Audit
// - TRB-centric, audit-aware presentation
// - Read-only (Phase 2)
// - Mirrors Vessels module UX quality
//
// IMPORTANT:
// - UI/UX only (mock data)
// - No backend calls
// - No personal HR data
// - Safe for MMD / Flag / Class walkthroughs
//
// NEXT PHASES (NOT IN THIS FILE):
// - Cadet detail page
// - Vessel reassignment
// - TRB deep-dive
// - Evidence-level audit views

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Filter,
  Info,
  BookCheck,
  Ship,
} from "lucide-react";
import { useNavigate } from "react-router-dom";


/* -------------------------------------------------------------------------- */
/* Mock Cadet Data — READ ONLY                                                 */
/* -------------------------------------------------------------------------- */
/* NOTE:
   Replace with backend data in Phase 3.
   Structure is intentionally audit-first.
*/
const cadets = [
  {
    id: "c1",
    name: "Rahul Sharma",
    stream: "Deck Cadet",
    vessel: "MV Ocean Pioneer",
    trbType: "Deck — Operational Level",
    trbStatus: "In Progress",
    auditReady: false,
  },
  {
    id: "c2",
    name: "Amit Verma",
    stream: "Engine Cadet",
    vessel: "MT Blue Horizon",
    trbType: "Engine — Operational Level",
    trbStatus: "Completed",
    auditReady: true,
  },
  {
    id: "c3",
    name: "Kunal Mehta",
    stream: "Deck Cadet",
    vessel: "MV Eastern Light",
    trbType: "Deck — Operational Level",
    trbStatus: "Pending Signatures",
    auditReady: false,
  },
];

/* -------------------------------------------------------------------------- */
/* TRB Status Pill                                                            */
/* -------------------------------------------------------------------------- */
function TRBStatusPill({ status }: { status: string }) {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "Completed") {
    return (
      <span className={`${base} bg-green-500/10 text-green-600`}>
        Completed
      </span>
    );
  }

  if (status === "Pending Signatures") {
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-600`}>
        Pending Signatures
      </span>
    );
  }

  return (
    <span className={`${base} bg-blue-500/10 text-blue-600`}>
      In Progress
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit Readiness Badge                                                       */
/* -------------------------------------------------------------------------- */
function AuditReadyBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
      Audit Ready
    </span>
  ) : (
    <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
      Not Ready
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminCadetsPage() {

  const navigate = useNavigate();  
  // ---------------- UI State (Read-only) ----------------
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState<
    "ALL" | "Deck Cadet" | "Engine Cadet"
  >("ALL");

  // ---------------- Derived Cadet List ----------------
  const filteredCadets = useMemo(() => {
    return cadets.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.vessel.toLowerCase().includes(search.toLowerCase());

      const matchesStream =
        streamFilter === "ALL" || c.stream === streamFilter;

      return matchesSearch && matchesStream;
    });
  }, [search, streamFilter]);

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
        <div className="flex items-start justify-between gap-4">
        <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
            <User size={20} />
            Cadets
            </h1>

            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Training Record Book status overview for all cadets.
            </p>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
            {/* Primary action */}
            <button
            onClick={() => navigate("/admin/cadets/create")}
            className="
                px-4 py-2
                rounded-md
                bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                hover:opacity-90
            "
            >
            + Add Trainee
            </button>

            {/* Info action — UX only */}
            <button
            onClick={() =>
                toast.message("Cadet management will expand in Phase 3")
            }
            className="
                h-9 w-9
                flex items-center justify-center
                rounded-md
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--muted))]
            "
            aria-label="Cadet information"
            title="About cadets module"
            >
            <Info size={18} />
            </button>
        </div>
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
          placeholder="Search cadet or vessel"
          className="
            px-3 py-2 rounded-md
            border border-[hsl(var(--border))]
            bg-transparent
            text-sm
            outline-none
            focus:ring-2 focus:ring-[hsl(var(--primary))]
          "
        />

        {/* Stream Filter */}
        <div className="flex items-center gap-1">
          {["ALL", "Deck Cadet", "Engine Cadet"].map((stream) => (
            <button
              key={stream}
              onClick={() =>
                setStreamFilter(
                  stream as "ALL" | "Deck Cadet" | "Engine Cadet"
                )
              }
              className={[
                "px-3 py-1.5 rounded-md text-sm border",
                streamFilter === stream
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              ].join(" ")}
            >
              {stream}
            </button>
          ))}
        </div>
      </div>

      {/* ============================ CADET TABLE ============================ */}
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
                Cadet
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Vessel
              </th>
              <th className="px-4 py-3 text-left font-medium">
                TRB
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Status
              </th>
              <th className="px-4 py-3 text-center font-medium">
                Audit
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredCadets.map((cadet) => (
              <tr
                key={cadet.id}
                onClick={() => navigate(`/admin/cadets/${cadet.id}`)}
                className="
                  border-t border-[hsl(var(--border))]
                  hover:bg-[hsl(var(--muted))]
                "
              >
                {/* Cadet identity */}
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {cadet.name}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {cadet.stream}
                  </div>
                </td>

                {/* Vessel */}
                <td className="px-4 py-3 flex items-center gap-2">
                  <Ship size={14} />
                  {cadet.vessel}
                </td>

                {/* TRB Type */}
                <td className="px-4 py-3 flex items-center gap-2">
                  <BookCheck size={14} />
                  {cadet.trbType}
                </td>

                {/* TRB Status */}
                <td className="px-4 py-3">
                  <TRBStatusPill status={cadet.trbStatus} />
                </td>

                {/* Audit readiness */}
                <td className="px-4 py-3 text-center">
                  <AuditReadyBadge ready={cadet.auditReady} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This is a read-only cadet overview. Detailed TRB inspection and
        edits are performed through Audit Mode and Approval workflows.
      </p>
    </div>
  );
}
