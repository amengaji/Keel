// keel-web/src/admin/layout/AdminSidebar.tsx
//
// Keel Shore Admin — Sidebar Navigation (Phase 2.5 IA)
// ----------------------------------------------------
// PURPOSE:
// - Maritime-correct information architecture
// - Audit-first navigation
// - Scales for Fleet / DPA / MMD usage
//
// UX PRINCIPLES:
// - Domain-based grouping (not feature-based)
// - Shallow navigation (max 2 levels)
// - Clear authority separation
// - Icons mandatory for scannability

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ship,
  Users,
  ListChecks,
  FileCheck,
  XCircle,
  ShieldCheck,
  Lock,
  Archive,
  BarChart3,
  Settings,
  Upload,
  UserCog,
  Layers,
} from "lucide-react";

type AdminSidebarProps = {
  collapsed: boolean;
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  /* ========================== COMMAND ========================== */
  {
    title: "Command",
    items: [
      {
        to: "/admin/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={18} />,
      },
    ],
  },

  

  /* ======================== OPERATIONS ========================= */
  {
    title: "Operations",
    items: [
      {
        to: "/admin/vessels",
        label: "Vessels",
        icon: <Ship size={18} />,
      },
      {
        to: "/admin/cadets",
        label: "Cadets",
        icon: <Users size={18} />,
      },
      {
        to: "/admin/training-progress",
        label: "Training Progress",
        icon: <ListChecks size={18} />,
      },
      {
        to: "/admin/assignments",
        label: "Assignments",
        icon: <Users size={18} />,
      },
    ],
  },

  /* ======================== APPROVALS ========================== */
  {
    title: "Approvals",
    items: [
      {
        to: "/admin/pending-signatures",
        label: "Pending Signatures",
        icon: <FileCheck size={18} />,
        badge: 3,
      },
      {
        to: "/admin/rejected",
        label: "Rejected / Returned",
        icon: <XCircle size={18} />,
        badge: 3, // mock count for Phase 2

      },
    ],
  },

  /* ===================== AUDIT & COMPLIANCE ==================== */
  {
    title: "Audit & Compliance",
    items: [
      {
        to: "/admin/audit-mode",
        label: "Audit Mode",
        icon: <ShieldCheck size={18} />,
      },
      {
        to: "/admin/locked-trbs",
        label: "Locked TRBs",
        icon: <Lock size={18} />,
      },
      {
        to: "/admin/evidence",
        label: "Evidence Repository",
        icon: <Archive size={18} />,
      },
    ],
  },

  /* ========================= REPORTS =========================== */
  {
    title: "Reports",
    items: [
      {
        to: "/admin/reports",
        label: "Reports",
        icon: <BarChart3 size={18} />,
      },
    ],
  },

  /* ========================= SETTINGS ========================== */
  {
    title: "Settings",
    items: [
      {
        to: "/admin/users",
        label: "Users & Roles",
        icon: <UserCog size={18} />,
      },
      {
        to: "/admin/vessel-types",
        label: "Vessel Types",
        icon: <Layers size={18} />,
      },
      {
        to: "/admin/imports",
        label: "Imports",
        icon: <Upload size={18} />,
      },
      {
        to: "/admin/settings",
        label: "System Settings",
        icon: <Settings size={18} />,
      },
    ],
  },
];

export function AdminSidebar({ collapsed }: AdminSidebarProps) {

  const sectionTone: Record<string, string> = {
  "Command": "",
  "Fleet": "",
  "Training": "",
  "Approvals": "border-l-2 border-yellow-500/50 pl-2",
  "Audit & Compliance": "border-l-2 border-red-500/50 pl-2",
  "Settings": "opacity-70",
};
  return (
    <aside
      className={[
        "border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        "transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[260px]",
      ].join(" ")}
    >
      {/* ============================ BRAND ============================ */}
      <div className="h-14 flex items-center px-3 border-b border-[hsl(var(--border))]">
        <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold">
          K
        </div>

        {!collapsed && (
          <div className="ml-3">
            <div className="font-semibold">Keel</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Shore Admin
            </div>
          </div>
        )}
      </div>

      {/* ========================== NAVIGATION ========================= */}
      <nav className="p-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title}className={sectionTone[section.title] ?? ""}>
            {!collapsed && (
              <div className="px-3 mb-2 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                {section.title}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    "transition-colors",
                    isActive
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : item.label === "Audit Mode"
                        ? "hover:bg-red-500/10 text-[hsl(var(--foreground))]"
                        : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  ].join(" ")
                }
                aria-label={item.label}
              >
                {item.icon}

                {!collapsed && <span>{item.label=== "Audit Mode" ? "Audit Mode (Read-only)": item.label}</span>}

                {/* Badge */}
                {item.badge !== undefined && (
                  <span
                    className="
                      ml-auto
                      min-w-[18px]
                      h-[18px]
                      px-1
                      rounded-full
                      bg-yellow-500/20
                      text-yellow-600
                      text-[10px]
                      font-semibold
                      flex items-center justify-center
                    "
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
