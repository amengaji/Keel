// keel-web/src/admin/pages/AdminTrainingProgressPage.tsx
//
// Keel — Training Progress (Fleet × Cadet × TRB Coverage)
// ----------------------------------------------------
// PURPOSE:
// - Fleet-wide visibility of cadet training compliance
// - Audit-first, read-only coverage dashboard
// - Designed for Shore Admin / DPA / Auditors
//
// IMPORTANT:
// - Phase 2 UI/UX only
// - Mock data only
// - No backend calls
// - No mutations
// - Safe for audits and demos
//
// FUTURE PHASES (NOT IN THIS FILE):
// - Live backend aggregation
// - Vessel-level grouping
// - Risk scoring & alerts
// - Export / reporting

import { toast } from "sonner";
import {
  Users,
  Ship,
  BookCheck,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Training Progress Data                                                 */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This data represents aggregated training posture.
   Replace with API response in Phase 3 without altering UI.
*/
const trainingProgress = [
  {
    id: "c1",
    cadet: "Rahul Sharma",
    stream: "Deck",
    vessel: "MV Ocean Pioneer",
    trbType: "Deck — Operational",
    completion: 92,
    missingEvidence: 3,
    pendingSignatures: 1,
    auditReady: false,
  },
  {
    id: "c2",
    cadet: "Amit Verma",
    stream: "Engine",
    vessel: "MT Blue Horizon",
    trbType: "Engine — Operational",
    completion: 100,
    missingEvidence: 0,
    pendingSignatures: 0,
    auditReady: true,
  },
  {
    id: "c3",
    cadet: "Neha Singh",
    stream: "Deck",
    vessel: "MV Eastern Light",
    trbType: "Deck — Operational",
    completion: 78,
    missingEvidence: 6,
    pendingSignatures: 2,
    auditReady: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Helper — Completion Bar                                                     */
/* -------------------------------------------------------------------------- */
function CompletionBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className="h-2 bg-[hsl(var(--primary))]"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-xs mt-1 text-right">{value}%</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper — Audit Status Badge                                                 */
/* -------------------------------------------------------------------------- */
function AuditStatus({ ready }: { ready: boolean }) {
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
export function AdminTrainingProgressPage() {
  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users size={20} />
            Training Progress
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Fleet-wide cadet training coverage and audit readiness.
          </p>
        </div>

        {/* UX-only info */}
        <button
          onClick={() =>
            toast.message("Training analytics will expand in Phase 3")
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="Training progress info"
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      {/* ============================ SUMMARY STRIP ============================ */}
      <div className="grid grid-cols-5 gap-4">
        <SummaryCard icon={<Users size={18} />} label="Total Cadets" value="3" />
        <SummaryCard icon={<Ship size={18} />} label="Active Vessels" value="3" />
        <SummaryCard icon={<BookCheck size={18} />} label="TRBs Completed" value="1" />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          label="Pending Issues"
          value="2"
        />
        <SummaryCard
          icon={<ShieldCheck size={18} />}
          label="Audit Ready"
          value="1"
        />
      </div>

      {/* ============================ MAIN TABLE ============================ */}
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
              <th className="px-4 py-3 text-left font-medium">TRB Type</th>
              <th className="px-4 py-3 text-left font-medium">Completion</th>
              <th className="px-4 py-3 text-center font-medium">Missing Evidence</th>
              <th className="px-4 py-3 text-center font-medium">Pending Signatures</th>
              <th className="px-4 py-3 text-center font-medium">Audit Status</th>
            </tr>
          </thead>

          <tbody>
            {trainingProgress.map((row) => (
              <tr
                key={row.id}
                className="
                  border-t border-[hsl(var(--border))]
                  hover:bg-[hsl(var(--muted))]
                "
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{row.cadet}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {row.stream} Cadet
                  </div>
                </td>

                <td className="px-4 py-3">{row.vessel}</td>
                <td className="px-4 py-3">{row.trbType}</td>

                <td className="px-4 py-3">
                  <CompletionBar value={row.completion} />
                </td>

                <td className="px-4 py-3 text-center">
                  {row.missingEvidence}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.pendingSignatures}
                </td>

                <td className="px-4 py-3 text-center">
                  <AuditStatus ready={row.auditReady} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This view is read-only. Detailed inspection and final verification are
        performed through Cadet Detail and Audit Mode.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card Component                                                      */
/* -------------------------------------------------------------------------- */
function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-lg
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        p-4
        space-y-2
      "
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
