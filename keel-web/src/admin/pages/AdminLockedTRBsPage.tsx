// keel-web/src/admin/pages/AdminLockedTRBsPage.tsx
//
// Keel — Locked TRBs (Sealed Register) — Phase 2.5
// ----------------------------------------------------
// PURPOSE:
// - Provide an audit-correct, read-only register of FINALIZED TRBs
// - Reinforce "sealed" and "non-reversible" posture (psychological safety)
// - Safe for demos, MMD / Flag / Class walkthroughs
//
// IMPORTANT (PHASE 2.5):
// - UI/UX only (mock data)
// - No backend calls
// - No edits, no unlock, no re-open actions
// - No navigation into the TRB contents yet (future phase)
//
// UX NOTES:
// - This screen is NOT an action screen. It is a register.
// - It must feel authoritative, immutable, and traceable.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Lock,
  ShieldCheck,
  Filter,
  Search,
  Info,
  Hash,
  Calendar,
  UserCheck,
  Ship,
  BookCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock sealed TRB register — READ ONLY                                        */
/* -------------------------------------------------------------------------- */
/* NOTE:
   Replace with API data in Phase 3 without changing UI structure.
   Fields chosen to match audit expectations:
   - who sealed it
   - when sealed
   - immutable reference (hash / record id)
*/
type SealedTRB = {
  id: string;
  cadetName: string;
  stream: "Deck Cadet" | "Engine Cadet" | "ETO Cadet" | "Deck Rating" | "Engine Rating";
  vesselName: string;
  imo: string;
  trbType: string;
  finalizedBy: "MASTER" | "CHIEF_ENGINEER" | "SHORE_ADMIN";
  finalizedOn: string; // ISO date-like string for demo
  recordHash: string;  // short hash for UI (mock)
};

const sealedTRBs: SealedTRB[] = [
  {
    id: "t1",
    cadetName: "Rahul Sharma",
    stream: "Deck Cadet",
    vesselName: "MV Ocean Pioneer",
    imo: "IMO 9876543",
    trbType: "Deck — Operational Level",
    finalizedBy: "MASTER",
    finalizedOn: "2026-06-28",
    recordHash: "9f3a1c2e7b1d",
  },
  {
    id: "t2",
    cadetName: "Amit Verma",
    stream: "Engine Cadet",
    vesselName: "MT Blue Horizon",
    imo: "IMO 9123456",
    trbType: "Engine — Operational Level",
    finalizedBy: "CHIEF_ENGINEER",
    finalizedOn: "2026-05-11",
    recordHash: "1c0d77aa8f21",
  },
  {
    id: "t3",
    cadetName: "Kunal Mehta",
    stream: "Deck Cadet",
    vesselName: "MV Eastern Light",
    imo: "IMO 9988776",
    trbType: "Deck — Operational Level",
    finalizedBy: "SHORE_ADMIN",
    finalizedOn: "2026-04-19",
    recordHash: "c81b0a992d55",
  },
];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Render a small pill for authority — reinforces "who can finalize". */
function AuthorityPill({ role }: { role: SealedTRB["finalizedBy"] }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";

  if (role === "MASTER") {
    return (
      <span className={`${base} bg-blue-500/10 text-blue-600`}>
        <UserCheck size={12} />
        Master
      </span>
    );
  }

  if (role === "CHIEF_ENGINEER") {
    return (
      <span className={`${base} bg-purple-500/10 text-purple-600`}>
        <UserCheck size={12} />
        Chief Engineer
      </span>
    );
  }

  return (
    <span className={`${base} bg-slate-500/10 text-slate-600`}>
      <UserCheck size={12} />
      Shore Admin
    </span>
  );
}

/** Render a locked "seal" badge. Always present. No interactions. */
function SealedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
      <Lock size={12} />
      Sealed
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page component                                                              */
/* -------------------------------------------------------------------------- */
export function AdminLockedTRBsPage() {
  // ---------------- UI-only state ----------------
  const [search, setSearch] = useState("");
  const [finalizedByFilter, setFinalizedByFilter] = useState<
    "ALL" | SealedTRB["finalizedBy"]
  >("ALL");

  // ---------------- Derived list ----------------
  const filtered = useMemo(() => {
    return sealedTRBs.filter((row) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        q.length === 0 ||
        row.cadetName.toLowerCase().includes(q) ||
        row.vesselName.toLowerCase().includes(q) ||
        row.imo.toLowerCase().includes(q) ||
        row.recordHash.toLowerCase().includes(q);

      const matchesAuthority =
        finalizedByFilter === "ALL" || row.finalizedBy === finalizedByFilter;

      return matchesSearch && matchesAuthority;
    });
  }, [search, finalizedByFilter]);

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Lock size={20} />
            Locked TRBs
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Sealed register of finalized Training Record Books. Read-only by design.
          </p>
        </div>

        {/* UX-only info action */}
        <button
          onClick={() =>
            toast.message(
              "Locked TRBs are sealed records. Viewing and verification will expand in Phase 3."
            )
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="About locked TRBs"
          title="About Locked TRBs"
        >
          <Info size={18} />
        </button>
      </div>

      {/* ============================ SEAL NOTICE ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
        "
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <ShieldCheck size={18} />
          </div>

          <div className="space-y-1">
            <div className="font-medium">
              Sealed Register (Immutable Record)
            </div>

            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Once finalized by Master, Chief Engineer, or Shore Admin, the TRB becomes a sealed record.
              The register is retained for compliance, audit, and traceability.
            </div>

            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Note: CTO can unlock for approvals but cannot finalize. Finalization authority remains with
              Master / Chief Engineer / Shore Admin.
            </div>
          </div>
        </div>
      </div>

      {/* ============================ FILTER BAR ============================ */}
      <div
        className="
          flex flex-wrap items-center gap-3
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          px-4 py-3
        "
      >
        <Filter size={16} />

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[hsl(var(--muted-foreground))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cadet, vessel, IMO, or hash"
            className="
              px-3 py-2 rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              text-sm
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
            aria-label="Search sealed TRBs"
          />
        </div>

        {/* Authority filter (Segmented) */}
        <div className="flex items-center gap-1">
          {[
            { key: "ALL" as const, label: "All" },
            { key: "MASTER" as const, label: "Master" },
            { key: "CHIEF_ENGINEER" as const, label: "C/E" },
            { key: "SHORE_ADMIN" as const, label: "Shore" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFinalizedByFilter(opt.key)}
              className={[
                "px-3 py-1.5 rounded-md text-sm border",
                finalizedByFilter === opt.key
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              ].join(" ")}
              aria-label={`Filter by ${opt.label}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Quick count (read-only signal) */}
        <div className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">
          Showing <span className="font-medium text-[hsl(var(--foreground))]">{filtered.length}</span>{" "}
          sealed records
        </div>
      </div>

      {/* ============================ REGISTER TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">Cadet</th>
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-left font-medium">TRB</th>
              <th className="px-4 py-3 text-left font-medium">Finalized By</th>
              <th className="px-4 py-3 text-left font-medium">Finalized On</th>
              <th className="px-4 py-3 text-left font-medium">Record</th>
              <th className="px-4 py-3 text-center font-medium">Seal</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              >
                {/* Cadet */}
                <td className="px-4 py-3">
                  <div className="font-medium">{row.cadetName}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {row.stream}
                  </div>
                </td>

                {/* Vessel */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Ship size={14} />
                    <span className="font-medium">{row.vesselName}</span>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {row.imo}
                  </div>
                </td>

                {/* TRB */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BookCheck size={14} />
                    <span>{row.trbType}</span>
                  </div>
                </td>

                {/* Authority */}
                <td className="px-4 py-3">
                  <AuthorityPill role={row.finalizedBy} />
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{row.finalizedOn}</span>
                  </div>
                </td>

                {/* Hash */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Hash size={14} />
                    <span className="font-mono text-xs">{row.recordHash}</span>
                  </div>

                  <button
                    onClick={() => toast.success("Hash copied (mock)")}
                    className="
                      mt-1
                      text-xs
                      underline
                      text-[hsl(var(--muted-foreground))]
                      hover:text-[hsl(var(--foreground))]
                    "
                    aria-label="Copy record hash"
                  >
                    Copy hash
                  </button>
                </td>

                {/* Seal */}
                <td className="px-4 py-3 text-center">
                  <SealedBadge />
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"
                >
                  No sealed TRBs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Locked TRBs are immutable records intended for audit, compliance, and traceability.
        Detailed sealed TRB viewing will be enabled in a later phase.
      </p>
    </div>
  );
}
