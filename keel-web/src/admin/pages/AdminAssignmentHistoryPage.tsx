// keel-web/src/admin/pages/AdminAssignmentHistoryPage.tsx
//
// Keel — Cadet ↔ Vessel Assignment History (Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Provide a clear, audit-safe history of cadet assignments to vessels
// - Answer the core compliance question:
//     “Who assigned this cadet to this vessel, and when?”
//
// IMPORTANT (PHASE 2.5):
// - Read-only UI
// - Backend integration ENABLED
// - No edits / reassignments
//
// UX PHILOSOPHY:
// - This is NOT an action screen
// - This is an authoritative register
// - Calm, factual, traceable presentation for audits

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Link2,
  User,
  Ship,
  Calendar,
  UserCheck,
  Filter,
  Search,
  Info,
  Loader2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Assignment Record Type                                                     */
/* -------------------------------------------------------------------------- */
type AssignmentRecord = {
  id: string;
  cadetName: string;
  cadetStream: string; // Backend defaults to "Cadet" for now
  vesselName: string;
  imo: string;
  assignedBy: "SHORE_ADMIN" | "MASTER";
  assignedOn: string; // ISO-like date string
  isCurrent: boolean;
};

/* -------------------------------------------------------------------------- */
/* Helper UI Components                                                       */
/* -------------------------------------------------------------------------- */

/** Authority pill — shows who performed the assignment */
function AuthorityPill({ role }: { role: AssignmentRecord["assignedBy"] }) {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";

  if (role === "MASTER") {
    return (
      <span className={`${base} bg-blue-500/10 text-blue-600`}>
        <UserCheck size={12} />
        Master
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

/** Current assignment badge */
function CurrentBadge() {
  return (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
      Current
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminAssignmentHistoryPage() {
  // ---------------- UI-only state ----------------
  const [search, setSearch] = useState("");
  const [currentOnly, setCurrentOnly] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------- Fetch Data ----------------
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/admin/cadet-assignments", {
          signal: abortController.signal,
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load history");

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAssignments(json.data);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          toast.error("Unable to load assignment history");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => abortController.abort();
  }, []);

  // ---------------- Derived list ----------------
  const filtered = useMemo(() => {
    return assignments.filter((row) => {
      const q = search.toLowerCase();

      const matchesSearch =
        q.length === 0 ||
        row.cadetName.toLowerCase().includes(q) ||
        row.vesselName.toLowerCase().includes(q) ||
        row.imo.toLowerCase().includes(q);

      const matchesCurrent =
        !currentOnly || row.isCurrent === true;

      return matchesSearch && matchesCurrent;
    });
  }, [search, currentOnly, assignments]);

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Link2 size={20} />
            Assignment History
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Read-only register of cadet assignments to vessels.
          </p>
        </div>

        {/* Info / UX cue */}
        <button
          onClick={() =>
            toast.message(
              "Assignments are recorded for audit traceability. Reassignment will be enabled in Phase 3."
            )
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="About assignment history"
        >
          <Info size={18} />
        </button>
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
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cadet, vessel, or IMO"
            className="
              px-3 py-2 rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              text-sm
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
          />
        </div>

        {/* Current only toggle (UX-safe boolean) */}
        <button
          onClick={() => setCurrentOnly((v) => !v)}
          className={[
            "px-3 py-1.5 rounded-md text-sm border",
            currentOnly
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
          ].join(" ")}
        >
          Current Assignments Only
        </button>

        <div className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">
          Showing <span className="font-medium">{filtered.length}</span> records
        </div>
      </div>

      {/* ============================ ASSIGNMENT TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">Assigned By</th>
              <th className="px-4 py-3 text-left font-medium">Assigned On</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"
                >
                  No assignment records match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                >
                  {/* Cadet */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span className="font-medium">{row.cadetName}</span>
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {row.cadetStream}
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

                  {/* Assigned by */}
                  <td className="px-4 py-3">
                    <AuthorityPill role={row.assignedBy} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {row.assignedOn}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {row.isCurrent && <CurrentBadge />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Assignment history is retained for audit traceability. Changes to
        cadet–vessel assignments are controlled and logged in later phases.
      </p>
    </div>
  );
}