// keel-web/src/admin/pages/AdminReportsPage.tsx
//
// Keel — Reports (Compliance & Audit Outputs)
// ----------------------------------------------------
// PURPOSE:
// - Central launchpad for all compliance-grade reports
// - Designed for MMD / Flag / Class expectations
// - Read-only, export-oriented (no analytics)
// - Calm, authoritative UX
//
// IMPORTANT:
// - UI/UX only (Phase 2.5)
// - No backend calls
// - No charts
// - No filters
//
// NEXT PHASES (NOT IN THIS FILE):
// - PDF / Excel exports
// - Report generation backend
// - Digital audit pack bundling

import { useNavigate } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  ClipboardList,
  Archive,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Report Card — simple, explicit                                              */
/* -------------------------------------------------------------------------- */
function ReportCard({
  title,
  description,
  icon,
  to,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="
        w-full
        rounded-lg
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        p-5
        text-left
        transition
        hover:bg-[hsl(var(--muted))]
      "
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">{icon}</div>

        <div>
          <div className="font-medium">{title}</div>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* ============================ PAGE HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Compliance-ready reports for audit, review, and export.
        </p>
      </div>

      {/* ============================ REPORT GROUP ============================ */}
      <div className="space-y-4">
        {/* TRB STATUS REPORTS */}
        <ReportCard
          title="Training Record Book Status"
          description="Fleet-wide overview of TRB completion, pending signatures, and finalised records."
          icon={<ClipboardList size={20} />}
          to="/admin/reports/trb-status"
        />

        {/* AUDIT READINESS */}
        <ReportCard
          title="Audit Readiness Report"
          description="Identifies cadets and vessels ready or pending for regulatory inspection."
          icon={<ShieldCheck size={20} />}
          to="/admin/reports/audit-readiness"
        />

        {/* EVIDENCE REGISTER */}
        {/* <ReportCard
          title="Evidence Register"
          description="Summary of evidence availability, gaps, and weak submissions."
          icon={<Archive size={20} />}
          to="/admin/reports/evidence"
        /> */}

        
        {/* NEW — Evidence Completeness */}
        <ReportCard
            title="Evidence Completeness Report"
            description="Uploaded versus required evidence across cadets and vessels."
            icon={<Archive size={20} />}
            to="/admin/reports/evidence-completeness"
        />


        {/* SIGNATURE REGISTER */}
        <ReportCard
          title="Signature & Finalisation Register"
          description="Chronological register of signatures, locks, and approving authorities."
          icon={<FileText size={20} />}
          to="/admin/reports/signatures"
        />
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        All reports are read-only. Export and audit pack generation will be
        enabled in later phases.
      </p>
    </div>
  );
}
