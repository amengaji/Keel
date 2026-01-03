// keel-web/src/admin/pages/AdminVesselDetailPage.tsx
//
// Keel — Vessel Detail (Read-Only Drill-Down)
// ----------------------------------------------------
// PURPOSE:
// - Read-only vessel profile for Shore / DPA / Audit
// - IMO-first maritime identity
// - Training & TRB relevance snapshot
// - Audit posture visibility
//
// IMPORTANT:
// - UI/UX only (mock data)
// - No backend calls
// - No edit or mutation actions
// - Designed to be audit-safe and demo-safe
//
// FUTURE PHASES (NOT IN THIS FILE):
// - Edit vessel
// - Cadet assignment
// - Live audit risk scoring
// - Evidence linkage per vessel

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Ship,
  ArrowLeft,
  Anchor,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Vessel Detail Data                                                     */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This will later be fetched by vesselId.
   For now, static data ensures UX stability.
*/
const vessel = {
  id: "v1",
  imo: "IMO 9876543",
  name: "MV Ocean Pioneer",
  type: "Bulk Carrier",
  flag: "Panama",
  classSociety: "DNV",
  status: "Active",
  yearBuilt: 2015,
  cadetsOnboard: 2,
  activeTRBs: 2,
  auditRisk: "Low",
};

/* -------------------------------------------------------------------------- */
/* Mock Assigned Trainees (Read-Only)                                          */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This mirrors Cadet → Vessel assignments.
   Replace with backend linkage in Phase 3.
*/
const assignedTrainees = [
  {
    id: "c1",
    name: "Rahul Sharma",
    stream: "Deck Cadet",
    trbStatus: "In Progress",
    auditReady: false,
  },
  {
    id: "c2",
    name: "Amit Verma",
    stream: "Engine Cadet",
    trbStatus: "Completed",
    auditReady: true,
  },
];


/* -------------------------------------------------------------------------- */
/* Small helper — label + value row                                            */
/* -------------------------------------------------------------------------- */
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminVesselDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* ============================ BACK NAV ============================ */}
      <button
        onClick={() => navigate("/admin/vessels")}
        className="
          inline-flex items-center gap-2
          text-sm
          px-3 py-1.5
          rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
        aria-label="Back to vessels"
      >
        <ArrowLeft size={16} />
        Back to Vessels
      </button>

      {/* ============================ HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Ship size={20} />
            {vessel.name}
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {vessel.imo} · {vessel.type}
          </p>
        </div>

        {/* UX-only info action */}
        <button
          onClick={() =>
            toast.message("Vessel editing will be available in Phase 3")
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="Vessel actions"
        >
          <Anchor size={18} />
        </button>
      </div>

      {/* ============================ VESSEL IDENTITY ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
          space-y-2
        "
      >
        <InfoRow label="IMO Number" value={vessel.imo} />
        <InfoRow label="Flag State" value={vessel.flag} />
        <InfoRow label="Class Society" value={vessel.classSociety} />
        <InfoRow label="Year Built" value={vessel.yearBuilt} />
        <InfoRow label="Operational Status" value={vessel.status} />
      </div>

      {/* ============================ TRAINING SNAPSHOT ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
        "
      >
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <ClipboardList size={16} />
          Training Snapshot
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow
            label="Cadets Onboard"
            value={vessel.cadetsOnboard}
          />
          <InfoRow
            label="Active TRBs"
            value={vessel.activeTRBs}
          />
        </div>
      </div>


      {/* ============================ ASSIGNED TRAINEES ============================ */}
        <div
        className="
            rounded-lg
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
            p-4
        "
        >
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            Assigned Trainees
        </h2>

        {assignedTrainees.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No trainees are currently assigned to this vessel.
            </p>
        ) : (
            <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
                <tr>
                <th className="px-3 py-2 text-left font-medium">
                    Trainee
                </th>
                <th className="px-3 py-2 text-left font-medium">
                    Stream
                </th>
                <th className="px-3 py-2 text-left font-medium">
                    TRB Status
                </th>
                <th className="px-3 py-2 text-center font-medium">
                    Audit
                </th>
                </tr>
            </thead>

            <tbody>
                {assignedTrainees.map((trainee) => (
                <tr
                    key={trainee.id}
                    onClick={() =>
                    navigate(`/admin/cadets/${trainee.id}`)
                    }
                    className="
                    border-t border-[hsl(var(--border))]
                    hover:bg-[hsl(var(--muted))]
                    cursor-pointer
                    "
                >
                    <td className="px-3 py-2 font-medium">
                    {trainee.name}
                    </td>
                    <td className="px-3 py-2">
                    {trainee.stream}
                    </td>
                    <td className="px-3 py-2">
                    {trainee.trbStatus}
                    </td>
                    <td className="px-3 py-2 text-center">
                    {trainee.auditReady ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
                        Ready
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
                        Not Ready
                        </span>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}

        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            Trainee assignments are read-only during audit review.
            Reassignment is restricted once TRB activity exists.
        </p>
        </div>




      {/* ============================ AUDIT POSTURE ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
        "
      >
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <ShieldCheck size={16} />
          Audit Posture
        </h2>

        <div className="flex justify-between items-center text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">
            Current Risk Level
          </span>

          <span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-600">
            {vessel.auditRisk} Risk
          </span>
        </div>

        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          Audit posture is derived from active TRBs, evidence
          completeness, and signature status.
        </p>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This vessel profile is read-only. All data shown reflects the
        current audit-safe state of the vessel.
      </p>
    </div>
  );
}
