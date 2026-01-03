// keel-web/src/admin/audit/AuditLandingPage.tsx
//
// Keel — Audit Mode | Landing Screen (Screen A)
// ----------------------------------------------------
// PURPOSE:
// - Primary audit queue for MMD / Flag / Vetting inspectors
// - Evidence-first prioritization (no context hunting)
// - Immediate visibility of audit risk and readiness
// - Read-only, calm, authoritative UX
//
// IMPORTANT UX PRINCIPLES:
// - Auditor must know where to start in <10 seconds
// - Weak / incomplete records must surface first
// - “Ready” is a state, not an encouragement to rush

import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Card Primitive — explicit, predictable, audit-safe                          */
/* -------------------------------------------------------------------------- */
function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        p-6
        ring-1 ring-[hsl(var(--border))]
      "
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit Row — single TRB summary                                              */
/* -------------------------------------------------------------------------- */
import { useNavigate } from "react-router-dom";

function AuditRow({
  cadet,
  vessel,
  trb,
  note,
  statusColor,
}: {
  cadet: string;
  vessel: string;
  trb: string;
  note: string;
  statusColor: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/admin/audit-mode/trb")}
      className="
        w-full text-left
        flex items-center justify-between
        rounded-lg
        border border-[hsl(var(--border))]
        px-4 py-3

        hover:bg-[hsl(var(--muted))]
        focus:outline-none
        focus:ring-2
        focus:ring-[hsl(var(--primary))]
        transition-colors
      "
      aria-label={`Open audit review for ${cadet}`}
    >
      <div>
        <div className="font-medium">
          {cadet} · {trb}
        </div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {vessel}
        </div>
      </div>

      <div className={`text-sm font-medium ${statusColor}`}>
        {note}
      </div>
    </button>
  );
}


export function AuditLandingPage() {
  return (
    <div className="space-y-10">
      {/* ============================================================= */}
      {/* PAGE TITLE                                                    */}
      {/* ============================================================= */}
      <div>
        <h1 className="text-2xl font-semibold">
          Training Record Book Audit
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Evidence-first inspection queue. Records are ordered by audit risk.
        </p>
      </div>

      {/* ============================================================= */}
      {/* PRIORITY 1 — WEAK EVIDENCE                                    */}
      {/* ============================================================= */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-red-500">
          Weak Evidence (Immediate Attention)
        </h2>

        <div className="space-y-3">
          <AuditRow
            cadet="Rahul Sharma (Deck)"
            vessel="MV Ocean Pioneer"
            trb="Deck — Operational Level"
            note="Evidence strength below threshold"
            statusColor="text-red-500"
          />
        </div>
      </Card>

      {/* ============================================================= */}
      {/* PRIORITY 2 — INCOMPLETE RECORDS                               */}
      {/* ============================================================= */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-yellow-400">
          Incomplete Records
        </h2>

        <div className="space-y-3">
          <AuditRow
            cadet="Amit Verma (Engine)"
            vessel="MV Coastal Spirit"
            trb="Engine — Operational Level"
            note="3 tasks missing evidence · 1 signature pending"
            statusColor="text-yellow-400"
          />
        </div>
      </Card>

      {/* ============================================================= */}
      {/* PRIORITY 3 — READY FOR FINAL LOCK                             */}
      {/* ============================================================= */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-green-500">
          Ready for Final Lock
        </h2>

        <div className="space-y-3">
          <AuditRow
            cadet="Sanjay Nair (Deck)"
            vessel="MV Eastern Horizon"
            trb="Deck — Operational Level"
            note="All tasks complete · Evidence verified"
            statusColor="text-green-500"
          />
        </div>
      </Card>

      {/* ============================================================= */}
      {/* FOOTNOTE — AUDIT GUIDANCE                                     */}
      {/* ============================================================= */}
      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        Records shown here are read-only. Final lock authority remains restricted
        to Master, Chief Engineer, or Shore Authority.
      </div>
    </div>
  );
}
