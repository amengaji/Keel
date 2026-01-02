// keel-web/src/admin/layout/AdminTopbar.tsx
//
// Shore Admin — Topbar (Signature Vault Integrated)
//
// PURPOSE:
// - Sidebar toggle
// - Global search placeholder
// - Theme toggle (icon-based)
// - Signature Vault controls (Master / CTO unlock)
// - Notifications (icon-based)
//
// NOTES:
// - UX only (Phase 2)
// - No backend calls
// - Officer-friendly, low friction

import { toast } from "sonner";
import {
  Sun,
  Moon,
  Bell,
} from "lucide-react";

import { SignatureVaultDialog } from "../security/SignatureVaultDialog";
import { useSignatureVault } from "../security/SignatureVaultContext";

type AdminTopbarProps = {
  onToggleSidebar: () => void;
};

/* -------------------------------------------------------------------------- */
/* Theme helper                                                               */
/* -------------------------------------------------------------------------- */
function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  const isDark = document.documentElement.classList.contains("dark");

  /* ------------------------------------------------------------------------ */
  /* Signature Vault                                                          */
  /* ------------------------------------------------------------------------ */
  const {
    isUnlocked,
    unlockedRole,
    getRemainingMinutes,
    openDialog,
    lockNow,
  } = useSignatureVault();

  function toggleTheme() {
    const next = !isDark;
    applyThemeClass(next);
    localStorage.setItem("keel_theme", next ? "dark" : "light");
    toast.success(`Theme switched to ${next ? "Dark" : "Light"} mode`);
  }

  return (
    <>
      {/* ============================ TOPBAR ============================ */}
      <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center gap-3 px-4">
        {/* Sidebar toggle */}
        <button
          className="px-3 py-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          Sidebar
        </button>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <input
            className="
              w-full max-w-[520px]
              px-3 py-2 rounded-md
              border border-[hsl(var(--border))]
              bg-transparent
              outline-none
              focus:ring-2 focus:ring-[hsl(var(--primary))]
            "
            placeholder="Search cadet, vessel, task code, certificate..."
            aria-label="Global search"
          />
        </div>

        {/* ======================= SIGNATURE VAULT ======================= */}
        <div className="flex items-center gap-2">
          {!isUnlocked && (
            <>
              <button
                className="px-3 py-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                onClick={() => openDialog("MASTER")}
              >
                Unlock Master
              </button>

              <button
                className="px-3 py-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                onClick={() => openDialog("CTO")}
              >
                Unlock CTO
              </button>
            </>
          )}

          {isUnlocked && (
            <>
              {/* Status pill */}
              <div
                className="
                  px-3 py-1.5 rounded-full
                  bg-[hsl(var(--muted))]
                  text-sm
                "
              >
                {unlockedRole} Unlocked
                {getRemainingMinutes() !== null && (
                  <> · {getRemainingMinutes()} min</>
                )}
              </div>

              <button
                className="
                  px-3 py-1.5 rounded-md
                  border border-[hsl(var(--border))]
                  hover:bg-[hsl(var(--muted))]
                "
                onClick={lockNow}
              >
                Lock Now
              </button>
            </>
          )}
        </div>

        {/* ======================= UTILITIES ======================= */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            className="
              h-9 w-9
              flex items-center justify-center
              rounded-md
              border border-[hsl(var(--border))]
              hover:bg-[hsl(var(--muted))]
            "
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle light / dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <button
            className="
              h-9 w-9
              flex items-center justify-center
              rounded-md
              bg-[hsl(var(--primary))]
              text-[hsl(var(--primary-foreground))]
              hover:opacity-90
            "
            onClick={() => toast.message("Notifications coming next")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* ===================== SIGNATURE VAULT DIALOG ===================== */}
      <SignatureVaultDialog />
    </>
  );
}
