// keel-web/src/admin/pages/reports/AdminAuditReadinessReportPage.tsx
//
// Keel — Audit Readiness Report (Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Identify which cadets / vessels are ready for audit
// - Clearly state reasons when audit readiness is blocked
// - Provide a calm, regulator-friendly view
//
// IMPORTANT:
// - UI/UX only (Phase 2.5)
// - No backend calls
// - No edits or actions
//
// NEXT PHASES (NOT IN THIS FILE):
// - Filters
// - Export (PDF / Excel)
// - Backend data binding

import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, XCircle } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Audit Readiness Data                                                   */
/* -------------------------------------------------------------------------- */
const auditReadinessRows = [
  {
    id: "c1",
    cadet: "Rahul Sharma",
    vessel: "MV Ocean Pioneer",
    status: "Not Ready",
    reason: "Missing evidence (3 items)",
  },
  {
    id: "c2",
    cadet: "Amit Verma",
    vessel: "MT Blue Horizon",
    status: "Audit Ready",
    reason: "All checks complete",
  },
  {
    id: "c3",
    cadet: "Kunal Mehta",
    vessel: "MV Eastern Light",
    status: "Not Ready",
    reason: "Pending signatures",
  },
];

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */
function ReadinessBadge({ value }: { value: string }) {
  return value === "Audit Ready" ? (
    <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
      Audit Ready
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-600">
      Not Ready
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminAuditReadinessReportPage() {
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
          <ShieldCheck size={20} />
          Audit Readiness Report
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Current audit readiness status across cadets and vessels.
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
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">
                Blocking Reason
              </th>
            </tr>
          </thead>

          <tbody>
            {auditReadinessRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="px-4 py-3 font-medium">{row.cadet}</td>
                <td className="px-4 py-3">{row.vessel}</td>
                <td className="px-4 py-3 text-center">
                  <ReadinessBadge value={row.status} />
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {row.status !== "Audit Ready" && (
                    <XCircle size={14} className="text-red-500" />
                  )}
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This report is read-only. Audit readiness is determined by TRB
        completion, evidence sufficiency, and signature status.
      </p>
    </div>
  );
}
