// keel-web/src/admin/pages/AdminDashboardPage.tsx
//
// Keel Shore Admin — Command Center Dashboard
// ----------------------------------------------------
// PURPOSE:
// - Fleet-wide situational awareness
// - Audit readiness at a glance
// - Ghost Signature status visibility (Module 2.2C)
// - Shore-side control room UX
//
// NOTES:
// - Uses shared Card primitives
// - Static mock data ONLY
// - No backend / no sync logic yet

import {
  Card,
  CardHeader,
  StatCard,
} from "../components/ui/Card";

import {
  Ship,
  Users,
  FileCheck,
  PenTool,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Ghost Signature Status Data                                            */
/* -------------------------------------------------------------------------- */
const mockSignatureStatus = [
  {
    vessel: "MV Ocean Pioneer",
    cadet: "Rahul Sharma",
    task: "1.1 Maintain a safe navigational watch",
    status: "AWAITING_BOTH",
  },
  {
    vessel: "MV Ocean Pioneer",
    cadet: "Amit Verma",
    task: "3.2 Engine room familiarisation",
    status: "CTO_SIGNED",
  },
  {
    vessel: "MT Blue Horizon",
    cadet: "Suresh Iyer",
    task: "2.4 Cargo watchkeeping",
    status: "MASTER_SIGNED",
  },
  {
    vessel: "MT Blue Horizon",
    cadet: "Nikhil Rao",
    task: "4.1 Safety rounds",
    status: "VERIFIED",
  },
];

/* -------------------------------------------------------------------------- */
/* Status label helper (UX CONTRACT COMPLIANT)                                 */
/* -------------------------------------------------------------------------- */
function renderStatus(status: string) {
  switch (status) {
    case "AWAITING_BOTH":
      return (
        <span className="text-yellow-500 text-sm">
          Awaiting Officer Signatures
        </span>
      );

    case "CTO_SIGNED":
      return (
        <span className="text-green-500 text-sm">
          Signed by CTO · Awaiting Master
        </span>
      );

    case "MASTER_SIGNED":
      return (
        <span className="text-green-500 text-sm">
          Signed by Master · Awaiting CTO
        </span>
      );

    case "VERIFIED":
      return (
        <span className="text-green-600 font-medium text-sm">
          ✔ Verified
        </span>
      );

    default:
      return null;
  }
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      {/* ==========================================================
         PAGE HEADER
         ========================================================== */}
      <div>
        <h1 className="text-2xl font-semibold">
          Shore Command Center
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Fleet-wide training status, audit readiness, and operational health.
        </p>
      </div>

      {/* ==========================================================
         SUMMARY METRICS (TOP KPIs)
         ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Active Vessels"
          value={18}
          icon={<Ship size={20} />}
          onClick={() => {}}
        />

        <StatCard
          label="Cadets Onboard"
          value={64}
          icon={<Users size={20} />}
          onClick={() => {}}
        />

        <StatCard
          label="TRBs Ready for Lock"
          value={21}
          tone="success"
          icon={<FileCheck size={20} />}
          onClick={() => {}}
        />

        <StatCard
          label="Pending Signatures"
          value={9}
          tone="warning"
          icon={<PenTool size={20} />}
          onClick={() => {}}
        />
      </div>

      {/* ==========================================================
         OFFICER SIGNATURE STATUS (MODULE 2.2C — RESTORED)
         ========================================================== */}
      <Card>
        <CardHeader
          title="Officer Signature Status"
          subtitle="Who is waiting on whom (offline-aware)"
        />

        <div className="space-y-3">
          {mockSignatureStatus.map((item, index) => (
            <div
              key={index}
              className="
                flex flex-col sm:flex-row sm:items-center
                sm:justify-between
                gap-1 sm:gap-4
                px-3 py-2
                rounded-md
                bg-[hsl(var(--muted))]
              "
            >
              <div className="text-sm">
                <strong>{item.cadet}</strong> · {item.vessel}
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {item.task}
                </div>
              </div>

              <div>
                {renderStatus(item.status)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ==========================================================
         AUDIT READINESS SECTION
         ========================================================== */}
      <Card>
        <CardHeader
          title="Audit Readiness"
          subtitle="DG Shipping / MMD compliance snapshot"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Fully Compliant TRBs"
            value={42}
            tone="success"
          />

          <StatCard
            label="Missing Evidence"
            value={6}
            tone="warning"
          />

          <StatCard
            label="Rejected Tasks"
            value={3}
            tone="danger"
          />

          <StatCard
            label="Signatures > 7 Days"
            value={4}
            tone="warning"
          />
        </div>
      </Card>

      {/* ==========================================================
         FLEET TRAINING ACTIVITY
         ========================================================== */}
      <Card>
        <CardHeader
          title="Fleet Training Activity"
          subtitle="Recent sync and onboard training intensity"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left py-2">Vessel</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Cadets</th>
                <th className="text-left py-2">Last Sync</th>
                <th className="text-left py-2">Activity</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-[hsl(var(--border))]">
                <td className="py-2">MV Ocean Pioneer</td>
                <td className="py-2">Bulk Carrier</td>
                <td className="py-2">4</td>
                <td className="py-2 text-green-500">Online</td>
                <td className="py-2">High</td>
              </tr>

              <tr>
                <td className="py-2">MT Blue Horizon</td>
                <td className="py-2">Oil Tanker</td>
                <td className="py-2">3</td>
                <td className="py-2 text-yellow-400">Offline</td>
                <td className="py-2">Medium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
