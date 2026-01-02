// keel-web/src/admin/layout/AdminTopbar.tsx
// Shore Admin â€” Topbar
// - Sidebar toggle
// - Global search placeholder
// - Theme toggle
// - Notifications placeholder
//
// Note: Keeping controls simple first; we will upgrade with shadcn components next.

import { toast } from "sonner";

type AdminTopbarProps = {
  onToggleSidebar: () => void;
};

function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  const isDark = document.documentElement.classList.contains("dark");

  function toggleTheme() {
    const next = !isDark;
    applyThemeClass(next);
    localStorage.setItem("keel_theme", next ? "dark" : "light");
    toast.success(`Theme switched to ${next ? "Dark" : "Light"} mode`);
  }

  return (
    <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center gap-3 px-4">
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
          className="w-full max-w-[520px] px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-transparent outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          placeholder="Search cadet, vessel, task code, certificate..."
          aria-label="Global search"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          Theme
        </button>

        <button
          className="px-3 py-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => toast.message("Notifications coming next")}
          aria-label="Notifications"
        >
          Alerts
        </button>
      </div>
    </header>
  );
}
