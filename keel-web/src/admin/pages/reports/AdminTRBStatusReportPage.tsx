// keel-web/src/admin/pages/reports/AdminTRBStatusReportPage.tsx
//
// Keel — TRB Status Report (Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Fleet-wide view of Training Record Book status
// - Compliance-grade register for audit preparation
// - Read-only, export-oriented design
//
// IMPORTANT:
// - UI/UX only (Phase 2.5)
// - No backend calls
// - No edits or actions
//
// NEXT PHASES (NOT IN THIS FILE):
// - Export (PDF / Excel)
// - Filters & sorting
// - Backend data binding

import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookCheck } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock TRB Status Data                                                        */
/* -------------------------------------------------------------------------- */
const trbStatusRows = [
  {
    id: "c1",
    cadet: "Rahul Sharma",
    rank: "Deck Cadet",
    vessel: "MV Ocean Pioneer",
    trbType: "Deck — Operational Level",
    completion: "92%",
    pendingSignatures: 1,
    finalised: false,
  },
  {
    id: "c2",
    cadet: "Amit Verma",
    rank: "Engine Cadet",
    vessel: "MT Blue Horizon",
    trbType: "Engine — Operational Level",
    completion: "100%",
    pendingSignatures: 0,
    finalised: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Finalisation Pill                                                           */
/* -------------------------------------------------------------------------- */
function FinalisedPill({ value }: { value: boolean }) {
  return value ? (
    <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
      Finalised
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-600">
      In Progress
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminTRBStatusReportPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ============================ BACK ============================ */}
      <button
        onClick={() => navigate("/admin/reports")}
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
        Back to Reports
      </button>

      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BookCheck size={20} />
          TRB Status Report
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Fleet-wide Training Record Book status for audit and compliance review.
        </p>
      </div>

      {/* ============================ TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">Rank</th>
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-left font-medium">TRB Type</th>
              <th className="px-4 py-3 text-center font-medium">Completion</th>
              <th className="px-4 py-3 text-center font-medium">
                Pending Signatures
              </th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {trbStatusRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="px-4 py-3 font-medium">{row.cadet}</td>
                <td className="px-4 py-3">{row.rank}</td>
                <td className="px-4 py-3">{row.vessel}</td>
                <td className="px-4 py-3">{row.trbType}</td>
                <td className="px-4 py-3 text-center">{row.completion}</td>
                <td className="px-4 py-3 text-center">
                  {row.pendingSignatures}
                </td>
                <td className="px-4 py-3 text-center">
                  <FinalisedPill value={row.finalised} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This report is read-only. Export and filtering will be enabled in later
        phases.
      </p>
    </div>
  );
}
