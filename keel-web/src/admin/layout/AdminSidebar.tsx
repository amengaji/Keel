// keel-web/src/admin/layout/AdminSidebar.tsx
//
// Keel Shore Admin — Sidebar Navigation (FINAL IA)
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
  BookCheck,
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
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
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
  {
    title: "Fleet",
    items: [
      {
        to: "/admin/vessels",
        label: "Vessels",
        icon: <Ship size={18} />,
      },
    ],
  },
  {
    title: "Training",
    items: [
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
        to: "/admin/trb-task-matrix",
        label: "TRB Task Library",
        icon: <BookCheck size={18} />,
      },
    ],
  },
  {
    title: "Approvals",
    items: [
      {
        to: "/admin/pending-signatures",
        label: "Pending Signatures",
        icon: <FileCheck size={18} />,
      },
      {
        to: "/admin/rejected",
        label: "Rejected / Returned",
        icon: <XCircle size={18} />,
      },
    ],
  },
  {
    title: "Audit & Compliance",
    items: [
      {
        to: "/admin/audit",
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
  {
    title: "Administration",
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
        label: "Settings",
        icon: <Settings size={18} />,
      },
    ],
  },
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
      {/* Brand */}
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

      {/* Navigation */}
      <nav className="p-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
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
                        : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
                    ].join(" ")
                  }
                  aria-label={item.label}
                >
                  {item.icon}

                  {/* Expanded label */}
                  {!collapsed && <span>{item.label}</span>}

                  {/* Collapsed tooltip */}
                  {collapsed && (
                    <div
                      className="
                        pointer-events-none
                        absolute left-full top-1/2 z-50
                        ml-3 -translate-y-1/2
                        whitespace-nowrap

                        rounded-md
                        bg-[hsl(var(--card))]
                        px-3 py-1.5
                        text-xs
                        text-[hsl(var(--foreground))]

                        shadow-lg
                        ring-1 ring-black/10 dark:ring-white/10

                        opacity-0
                        translate-x-1
                        transition-all duration-150

                        group-hover:opacity-100
                        group-hover:translate-x-0
                      "
                    >
                      {item.label}
                    </div>
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
