// keel-web/src/admin/pages/reports/AdminEvidenceCompletenessReportPage.tsx
//
// Keel — Evidence Completeness Report (Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Verify evidence presence per cadet and vessel
// - Highlight missing or weak evidence
// - Provide regulator-safe transparency
//
// IMPORTANT:
// - UI/UX only (Phase 2.5)
// - No backend calls
// - No downloads or edits
//
// NEXT PHASES (NOT IN THIS FILE):
// - Evidence drill-down
// - File preview
// - Export (PDF / Excel)

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, AlertTriangle } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Evidence Completeness Data                                             */
/* -------------------------------------------------------------------------- */
const evidenceRows = [
  {
    id: "e1",
    cadet: "Rahul Sharma",
    vessel: "MV Ocean Pioneer",
    required: 42,
    uploaded: 39,
    status: "Incomplete",
  },
  {
    id: "e2",
    cadet: "Amit Verma",
    vessel: "MT Blue Horizon",
    required: 38,
    uploaded: 38,
    status: "Complete",
  },
  {
    id: "e3",
    cadet: "Kunal Mehta",
    vessel: "MV Eastern Light",
    required: 41,
    uploaded: 35,
    status: "Incomplete",
  },
];

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */
function EvidenceStatusBadge({ status }: { status: string }) {
  return status === "Complete" ? (
    <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
      Complete
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-600">
      Incomplete
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */
export function AdminEvidenceCompletenessReportPage() {
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
          <Archive size={20} />
          Evidence Completeness Report
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Evidence upload completeness across cadets and vessels.
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
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-center font-medium">
                Uploaded / Required
              </th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {evidenceRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="px-4 py-3 font-medium">{row.cadet}</td>
                <td className="px-4 py-3">{row.vessel}</td>
                <td className="px-4 py-3 text-center">
                  {row.uploaded} / {row.required}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  {row.status !== "Complete" && (
                    <AlertTriangle
                      size={14}
                      className="text-yellow-600"
                    />
                  )}
                  <EvidenceStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Evidence completeness reflects uploaded files against TRB
        requirements. Missing evidence may block audit readiness.
      </p>
    </div>
  );
}
