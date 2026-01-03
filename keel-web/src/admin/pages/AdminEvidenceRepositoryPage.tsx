// keel-web/src/admin/pages/AdminEvidenceRepositoryPage.tsx
//
// Keel — Evidence Repository (Read-Only Ledger) — Phase 2.5
// ----------------------------------------------------------
// PURPOSE:
// - Central, read-only index of ALL evidence submitted against TRBs
// - Audit-first, traceable, non-editable presentation
// - Reinforces evidence → verification → signature → seal chain
//
// IMPORTANT (PHASE 2.5):
// - UI/UX only (mock data)
// - No uploads
// - No edits
// - No deletes
// - No navigation into raw files yet
//
// UX PHILOSOPHY:
// - This is NOT a file manager
// - This is an evidence ledger suitable for MMD / Flag / Class audits

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Filter,
  Search,
  FileText,
  Image,
  Video,
  ShieldCheck,
  Lock,
  Info,
  Calendar,
  UserCheck,
  Ship,
  BookCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Evidence Types                                                             */
/* -------------------------------------------------------------------------- */
type EvidenceType = "PHOTO" | "VIDEO" | "DOCUMENT" | "CERTIFICATE" | "LOG";

/* -------------------------------------------------------------------------- */
/* Mock Evidence Ledger — READ ONLY                                           */
/* -------------------------------------------------------------------------- */
/* NOTE:
   Replace with backend data in Phase 3.
   Fields selected to match real audit questioning.
*/
type EvidenceRecord = {
  id: string;
  type: EvidenceType;
  taskRef: string;
  cadetName: string;
  vesselName: string;
  imo: string;
  trbType: string;
  submittedBy: string;
  verifiedBy: "CTO" | "MASTER" | "CHIEF_ENGINEER" | "SHORE_ADMIN" | null;
  status: "Accepted" | "Pending" | "Rejected";
  submittedOn: string;
  trbLocked: boolean;
};

const evidenceLedger: EvidenceRecord[] = [
  {
    id: "e1",
    type: "PHOTO",
    taskRef: "Deck Task 3.2 — Mooring Operations",
    cadetName: "Rahul Sharma",
    vesselName: "MV Ocean Pioneer",
    imo: "IMO 9876543",
    trbType: "Deck — Operational Level",
    submittedBy: "Rahul Sharma",
    verifiedBy: "CTO",
    status: "Accepted",
    submittedOn: "2026-02-14",
    trbLocked: true,
  },
  {
    id: "e2",
    type: "VIDEO",
    taskRef: "Engine Task 2.1 — Pump Operation",
    cadetName: "Amit Verma",
    vesselName: "MT Blue Horizon",
    imo: "IMO 9123456",
    trbType: "Engine — Operational Level",
    submittedBy: "Amit Verma",
    verifiedBy: null,
    status: "Pending",
    submittedOn: "2026-03-02",
    trbLocked: false,
  },
  {
    id: "e3",
    type: "DOCUMENT",
    taskRef: "Deck Task 1.1 — Safety Induction",
    cadetName: "Kunal Mehta",
    vesselName: "MV Eastern Light",
    imo: "IMO 9988776",
    trbType: "Deck — Operational Level",
    submittedBy: "Kunal Mehta",
    verifiedBy: "MASTER",
    status: "Accepted",
    submittedOn: "2026-01-22",
    trbLocked: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Small Helpers                                                              */
/* -------------------------------------------------------------------------- */

function EvidenceIcon({ type }: { type: EvidenceType }) {
  if (type === "PHOTO") return <Image size={14} />;
  if (type === "VIDEO") return <Video size={14} />;
  return <FileText size={14} />;
}

function StatusBadge({ status }: { status: EvidenceRecord["status"] }) {
  const base = "px-2 py-1 rounded-md text-xs font-medium";

  if (status === "Accepted")
    return <span className={`${base} bg-green-500/10 text-green-600`}>Accepted</span>;

  if (status === "Rejected")
    return <span className={`${base} bg-red-500/10 text-red-600`}>Rejected</span>;

  return <span className={`${base} bg-yellow-500/10 text-yellow-600`}>Pending</span>;
}

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
      <Lock size={12} />
      Sealed
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminEvidenceRepositoryPage() {
  // ---------------- UI-only state ----------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EvidenceRecord["status"]>(
    "ALL"
  );

  // ---------------- Derived list ----------------
  const filtered = useMemo(() => {
    return evidenceLedger.filter((row) => {
      const q = search.toLowerCase();

      const matchesSearch =
        q.length === 0 ||
        row.cadetName.toLowerCase().includes(q) ||
        row.vesselName.toLowerCase().includes(q) ||
        row.taskRef.toLowerCase().includes(q) ||
        row.imo.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Archive size={20} />
            Evidence Repository
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Read-only ledger of all evidence submitted against Training Record Books.
          </p>
        </div>

        <button
          onClick={() =>
            toast.message(
              "Evidence uploads and inspection will expand in Phase 3."
            )
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="About evidence repository"
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
            placeholder="Search cadet, vessel, task, or IMO"
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

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {["ALL", "Accepted", "Pending", "Rejected"].map((s) => (
            <button
              key={s}
              onClick={() =>
                setStatusFilter(
                  s as "ALL" | "Accepted" | "Pending" | "Rejected"
                )
              }
              className={[
                "px-3 py-1.5 rounded-md text-sm border",
                statusFilter === s
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">
          Showing <span className="font-medium">{filtered.length}</span> records
        </div>
      </div>

      {/* ============================ EVIDENCE TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">Evidence</th>
              <th className="px-4 py-3 text-left font-medium">Task</th>
              <th className="px-4 py-3 text-left font-medium">Cadet</th>
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Submitted</th>
              <th className="px-4 py-3 text-center font-medium">Seal</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              >
                <td className="px-4 py-3 flex items-center gap-2">
                  <EvidenceIcon type={row.type} />
                  {row.type}
                </td>

                <td className="px-4 py-3">{row.taskRef}</td>

                <td className="px-4 py-3">{row.cadetName}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Ship size={14} />
                    {row.vesselName}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {row.imo}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {row.submittedOn}
                  </div>
                </td>

                <td className="px-4 py-3 text-center">
                  {row.trbLocked && <LockedBadge />}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]"
                >
                  No evidence matches the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Evidence records are immutable once verified and sealed as part of a finalized TRB.
      </p>
    </div>
  );
}
