// keel-web/src/admin/audit/AuditLandingPage.tsx
//
// Keel — Audit Mode | Landing Screen (Screen A)
//
// PURPOSE:
// - Entry point for MMD / Class / Flag auditors
// - Select context (Vessel + Cadet + TRB)
// - Show instant audit readiness snapshot
// - Read-only, calm, authoritative UX

import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Card Primitive — explicit, no magic                                         */
/* -------------------------------------------------------------------------- */
function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        p-6
        shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_30px_rgba(0,0,0,0.6)]
        ring-1 ring-white/10
      "
    >
      {children}
    </div>
  );
}

export function AuditLandingPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold">
          Training Record Book Audit
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Select a cadet and vessel to begin inspection.
        </p>
      </div>

      {/* Selection Panel */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Audit Context
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Vessel */}
          <div>
            <label className="text-sm font-medium">
              Vessel
            </label>
            <div className="mt-2 p-3 rounded-md bg-[hsl(var(--muted))]">
              MV Ocean Pioneer
            </div>
          </div>

          {/* Cadet */}
          <div>
            <label className="text-sm font-medium">
              Cadet
            </label>
            <div className="mt-2 p-3 rounded-md bg-[hsl(var(--muted))]">
              Rahul Sharma (Deck Cadet)
            </div>
          </div>

          {/* TRB Type */}
          <div>
            <label className="text-sm font-medium">
              TRB Type
            </label>
            <div className="mt-2 p-3 rounded-md bg-[hsl(var(--muted))]">
              Deck — Operational Level
            </div>
          </div>
        </div>
      </Card>

      {/* Readiness Snapshot */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Audit Readiness Snapshot
        </h2>

        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Tasks Completed
            </div>
            <div className="text-2xl font-semibold mt-1">
              92%
            </div>
          </div>

          <div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Missing Evidence
            </div>
            <div className="text-2xl font-semibold text-yellow-400 mt-1">
              3
            </div>
          </div>

          <div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Pending Signatures
            </div>
            <div className="text-2xl font-semibold text-yellow-400 mt-1">
              1
            </div>
          </div>

          <div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Last Sync
            </div>
            <div className="text-2xl font-semibold text-green-500 mt-1">
              Today
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Action */}
      <div className="flex justify-end">
        <button
          className="
            px-6 py-3 rounded-lg
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            font-medium
            hover:opacity-90
          "
        >
          Start Audit Review
        </button>
      </div>
    </div>
  );
}
