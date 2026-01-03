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
