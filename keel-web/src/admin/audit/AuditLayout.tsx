// keel-web/src/admin/audit/AuditLayout.tsx
//
// Keel — Audit Mode Layout (Screen E — Global)
// ----------------------------------------------------
// PURPOSE:
// - Dedicated read-only layout for MMD / Flag State / Vetting audits
// - Persistent audit-mode banner (trust + compliance reinforcement)
// - Clear authority and finalization messaging
// - Light / Dark mode toggle available even during audit
// - Explicit toast feedback on exiting Audit Mode
//
// IMPORTANT UX NOTES:
// - Theme control must NEVER disappear in Audit Mode
// - Exiting Audit Mode is a MODE TRANSITION and must be acknowledged
// - This layout intentionally removes admin sidebar chrome

import { Outlet, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function AuditLayout() {
  const navigate = useNavigate();

  /* -------------------------------------------------- */
  /* THEME STATE — mirrors App.tsx behavior              */
  /* -------------------------------------------------- */
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("keel_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Apply theme class to <html> root
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Persist preference (same key as AdminTopbar)
    localStorage.setItem("keel_theme", nextTheme);
    setTheme(nextTheme);

    // UX feedback — MUST match Admin Topbar behavior
    toast.success(`Theme switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode`);
  }


  /* -------------------------------------------------- */
  /* EXIT AUDIT MODE — explicit UX feedback              */
  /* -------------------------------------------------- */
  function exitAuditMode() {
    // IMPORTANT:
    // Toast must be allowed to render before navigation.
    // Immediate route change unmounts the layout and cancels toast paint.
    toast.success("Exited Audit Mode. Administrative controls restored.");

    // Allow one render frame before leaving Audit Mode
    setTimeout(() => {
      navigate("/admin/dashboard");
    }, 150);
  }


  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ============================================================= */}
      {/* AUDIT MODE BANNER — ALWAYS VISIBLE                             */}
      {/* ============================================================= */}
      <header className="border-b border-[hsl(var(--border))]">
        {/* Top strip — mode identification */}
        <div className="h-14 flex items-center justify-between px-6 bg-[hsl(var(--card))]">
          <div>
            <div className="font-semibold tracking-tight">
              🔒 Keel — Audit Mode
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Evidence-first Training Record Book inspection
            </div>
          </div>

          {/* Right controls: Theme toggle + Exit */}
          <div className="flex items-center gap-3">
            {/* Light / Dark toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light or dark mode"
              className="
                h-9 w-9 flex items-center justify-center rounded-md
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--muted))]
                transition-colors
              "
            >
              {theme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>

            {/* Exit audit mode — MUST confirm via toast */}
            <button
              onClick={exitAuditMode}
              className="
                text-sm px-4 py-1.5 rounded-md
                bg-[hsl(var(--muted))]
                hover:opacity-80
              "
            >
              Exit Audit Mode
            </button>
          </div>
        </div>

        {/* Bottom strip — compliance explanation */}
        <div className="px-6 py-3 bg-[hsl(var(--muted))]">
          <ul className="text-xs space-y-1 text-[hsl(var(--foreground))]">
            <li>
              • This interface is <strong>read-only</strong>. Training entries
              cannot be modified during audit.
            </li>
            <li>
              • <strong>CTO (Chief Officer / 2nd Engineer)</strong> may review and
              endorse evidence but <strong>cannot finalize</strong> the TRB.
            </li>
            <li>
              • Final TRB lock may only be performed by{" "}
              <strong>Master, Chief Engineer, or Shore Authority</strong>.
            </li>
            <li>
              • Once locked, the record is{" "}
              <strong>cryptographically sealed</strong> and cannot be altered.
            </li>
          </ul>
        </div>
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
