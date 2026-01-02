// keel-web/src/admin/audit/AuditLayout.tsx
//
// Keel — Audit Mode Layout (Screen E — Global)
// PURPOSE:
// - Dedicated read-only layout for MMD / Flag State audits
// - Persistent audit-mode banner (trust reinforcement)
// - Controlled exit from audit mode
// - No sidebar, no admin chrome

import { Outlet, useNavigate } from "react-router-dom";

export function AuditLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ============================================================= */}
      {/* AUDIT MODE BANNER — ALWAYS VISIBLE                             */}
      {/* ============================================================= */}
      <header className="h-14 border-b border-[hsl(var(--border))] flex items-center justify-between px-6">
        <div>
          <div className="font-semibold tracking-tight">
            🔒 Keel — MMD Audit Mode
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Read-only inspection interface · Changes disabled
          </div>
        </div>

        {/* Exit audit mode — explicit, no ambiguity */}
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="
            text-sm px-4 py-1.5 rounded-md
            bg-[hsl(var(--muted))]
            hover:opacity-80
          "
        >
          Exit Audit Mode
        </button>
      </header>

      {/* ============================================================= */}
      {/* AUDIT CONTENT                                                  */}
      {/* ============================================================= */}
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
