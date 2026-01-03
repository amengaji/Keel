// keel-web/src/admin/pages/AdminCadetDetailPage.tsx
//
// Keel — Cadet Detail (Read-Only Drill-Down)
// ----------------------------------------------------
// PURPOSE:
// - Read-only cadet profile for Shore / DPA / Audit
// - Training Record Book (TRB)–centric view
// - Vessel context included
// - Audit readiness visibility
//
// IMPORTANT:
// - UI/UX only (mock data)
// - No backend calls
// - No edits or mutations
// - Safe for MMD / Flag / Class walkthroughs
//
// FUTURE PHASES (NOT IN THIS FILE):
// - Editable cadet profile
// - Vessel reassignment
// - TRB task-by-task inspection
// - Evidence drill-down

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  BookCheck,
  ShieldCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Mock Cadet Detail Data                                                      */
/* -------------------------------------------------------------------------- */
/* NOTE:
   This will later be fetched by cadetId.
   Static data is intentional for Phase 2 stability.
*/
const cadet = {
  id: "c1",
  name: "Rahul Sharma",
  stream: "Deck Cadet",
  vessel: "MV Ocean Pioneer",
  trbType: "Deck — Operational Level",
  trbStatus: "In Progress",
  auditReady: false,
  joiningPeriod: "Jan 2026 – Jun 2026",
  tasksCompleted: "92%",
  pendingSignatures: 1,
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
/* TRB Status Pill                                                            */
/* -------------------------------------------------------------------------- */
function TRBStatusPill({ status }: { status: string }) {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "Completed") {
    return (
      <span className={`${base} bg-green-500/10 text-green-600`}>
        Completed
      </span>
    );
  }

  if (status === "Pending Signatures") {
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-600`}>
        Pending Signatures
      </span>
    );
  }

  return (
    <span className={`${base} bg-blue-500/10 text-blue-600`}>
      In Progress
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit Readiness Badge                                                       */
/* -------------------------------------------------------------------------- */
function AuditReadyBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
      Audit Ready
    </span>
  ) : (
    <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
      Not Audit Ready
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminCadetDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* ============================ BACK NAV ============================ */}
      <button
        onClick={() => navigate("/admin/cadets")}
        className="
          inline-flex items-center gap-2
          text-sm
          px-3 py-1.5
          rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
        aria-label="Back to cadets"
      >
        <ArrowLeft size={16} />
        Back to Cadets
      </button>

      {/* ============================ HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <User size={20} />
            {cadet.name}
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {cadet.stream} · {cadet.joiningPeriod}
          </p>
        </div>

        {/* UX-only info action */}
        <button
          onClick={() =>
            toast.message("Cadet editing will be available in Phase 3")
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="Cadet actions"
        >
          <User size={18} />
        </button>
      </div>

      {/* ============================ CADET IDENTITY ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
          space-y-2
        "
      >
        <InfoRow label="Cadet Name" value={cadet.name} />
        <InfoRow label="Stream / Rank" value={cadet.stream} />
        <InfoRow label="Assigned Vessel" value={cadet.vessel} />
      </div>

      {/* ============================ VESSEL ASSIGNMENT ============================ */}
        <div
        className="
            rounded-lg
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
            p-4
            space-y-3
        "
        >
        <h2 className="text-sm font-medium flex items-center gap-2">
            Vessel Assignment
        </h2>

        <InfoRow label="Assigned Vessel" value={cadet.vessel} />
        <InfoRow label="Assignment Period" value={cadet.joiningPeriod} />
        <InfoRow label="Assignment Status" value="Active" />

        {/* Assignment rules note */}
        <div className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            A trainee can have only one active vessel assignment at a time.
            Reassignment is restricted once Training Record Book entries
            exist or audit review has commenced.
        </div>

        {/* Action (disabled for Phase 2 / audit safety) */}
        <div className="pt-2">
            <button
            onClick={() =>
                toast.message(
                "Vessel reassignment will be available in Phase 3"
                )
            }
            className="
                px-4 py-2
                rounded-md
                border border-[hsl(var(--border))]
                opacity-60
                cursor-not-allowed
            "
            disabled
            >
            Reassign Vessel
            </button>
        </div>
        </div>


      {/* ============================ TRB SNAPSHOT ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
        "
      >
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <BookCheck size={16} />
          Training Record Book Snapshot
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="TRB Type" value={cadet.trbType} />
          <InfoRow label="Tasks Completed" value={cadet.tasksCompleted} />
          <InfoRow
            label="Pending Signatures"
            value={cadet.pendingSignatures}
          />
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              TRB Status
            </span>
            <TRBStatusPill status={cadet.trbStatus} />
          </div>
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
          Audit Readiness
        </h2>

        <div className="flex justify-between items-center text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">
            Current Audit Status
          </span>

          <AuditReadyBadge ready={cadet.auditReady} />
        </div>

        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          Audit readiness is determined by TRB completion, evidence
          sufficiency, and signature status.
        </p>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This cadet profile is read-only. Detailed inspection and
        verification is performed through Audit Mode.
      </p>
    </div>
  );
}
