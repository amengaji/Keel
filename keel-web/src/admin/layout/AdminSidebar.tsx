// keel-web/src/admin/layout/AdminSidebar.tsx
// Shore Admin â€” Sidebar Navigation
// Notes:
// - Collapsible for density
// - Uses brand primary color via CSS tokens
// - Keep labels maritime-friendly and audit-friendly

import { NavLink } from "react-router-dom";

type AdminSidebarProps = {
  collapsed: boolean;
};

type NavItem = {
  to: string;
  label: string;
  shortLabel: string; // used when collapsed
};

const navItems: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", shortLabel: "Dash" },
  { to: "/admin/vessel-types", label: "Vessel Types", shortLabel: "Types" },
  { to: "/admin/trb-task-matrix", label: "TRB Task Matrix", shortLabel: "TRB" },
  { to: "/admin/imports", label: "Template Imports", shortLabel: "Import" },
  { to: "/admin/vessels", label: "Vessels", shortLabel: "Vsl" },
  { to: "/admin/assignments", label: "Assignments", shortLabel: "Asgn" },
  { to: "/admin/trainees", label: "Trainees", shortLabel: "Trn" },
  { to: "/admin/issuance", label: "Issuance", shortLabel: "PDF" },
  { to: "/admin/users", label: "Users & Roles", shortLabel: "Users" },
  { to: "/admin/audit", label: "Audit Logs", shortLabel: "Audit" },
  { to: "/admin/settings", label: "Settings", shortLabel: "Set" },
];

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  return (
    <aside
      className={[
        "border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        "transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[260px]",
      ].join(" ")}
    >
      {/* Brand strip */}
      <div className="h-14 flex items-center px-3 border-b border-[hsl(var(--border))]">
        <div
          className="h-9 w-9 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold"
          aria-label="Keel logo placeholder"
          title="Keel"
        >
          K
        </div>

        {!collapsed && (
          <div className="ml-3 leading-tight">
            <div className="font-semibold">Keel</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Shore Admin
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                "transition-colors",
                isActive
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
              ].join(" ")
            }
            aria-label={item.label}
            title={item.label}
          >
            {/* Minimal â€œiconâ€ placeholder: we will replace with lucide icons later */}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[hsl(var(--border))] text-xs">
              â€¢
            </span>

            <span className={collapsed ? "sr-only" : ""}>
              {collapsed ? item.shortLabel : item.label}
            </span>

            {/* When collapsed, show short label as tooltip-like small text under dot (optional) */}
            {collapsed && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {item.shortLabel}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
