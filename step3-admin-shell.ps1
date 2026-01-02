# step3-admin-shell.ps1
# Creates Shore Admin shell layout for Keel Web
# - Sidebar (collapsible)
# - Topbar (search, theme toggle, notifications placeholder)
# - Admin routes wired
# - Uses primary color #3194A0 via CSS tokens already set

$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot "keel-web"

if (-not (Test-Path $root)) {
  throw "keel-web folder not found at: $root. Run from repo root."
}

$src = Join-Path $root "src"
$adminDir = Join-Path $src "admin"
$layoutDir = Join-Path $adminDir "layout"
$pagesDir = Join-Path $adminDir "pages"

New-Item -ItemType Directory -Force -Path $adminDir | Out-Null
New-Item -ItemType Directory -Force -Path $layoutDir | Out-Null
New-Item -ItemType Directory -Force -Path $pagesDir | Out-Null

# AdminLayout
@"
// keel-web/src/admin/layout/AdminLayout.tsx
// Shore Admin — Layout Shell
// - Collapsible sidebar
// - Topbar with theme toggle + global search placeholder
// - Content area renders current page via <Outlet />

import { Outlet } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useMemo(() => {
    return () => {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        toast.message(next ? "Sidebar collapsed" : "Sidebar expanded");
        return next;
      });
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} />

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar onToggleSidebar={toggleSidebar} />

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
"@ | Set-Content -Encoding UTF8 (Join-Path $layoutDir "AdminLayout.tsx")

# Sidebar
@"
// keel-web/src/admin/layout/AdminSidebar.tsx
// Shore Admin — Sidebar Navigation
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
            {/* Minimal “icon” placeholder: we will replace with lucide icons later */}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[hsl(var(--border))] text-xs">
              •
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
"@ | Set-Content -Encoding UTF8 (Join-Path $layoutDir "AdminSidebar.tsx")

# Topbar
@"
// keel-web/src/admin/layout/AdminTopbar.tsx
// Shore Admin — Topbar
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
"@ | Set-Content -Encoding UTF8 (Join-Path $layoutDir "AdminTopbar.tsx")

# Pages (placeholders)
@"
// keel-web/src/admin/pages/AdminDashboardPage.tsx
// Shore Admin — Dashboard (Placeholder)
// Next step: we will build the real dashboard widgets based on the Gemini concept + audit readiness.

export function AdminDashboardPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Placeholder. Next step: Fleet training status, audit readiness, pending approvals, and exceptions.
      </p>
    </div>
  );
}
"@ | Set-Content -Encoding UTF8 (Join-Path $pagesDir "AdminDashboardPage.tsx")

@"
// keel-web/src/admin/pages/AdminPlaceholderPage.tsx
// keel-web/src/admin/pages/AdminPlaceholderPage.tsx
// Reusable placeholder page component used until each screen is built.

type AdminPlaceholderPageProps = {
  title: string;
  description?: string;
};

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {description || "Placeholder. Screen will be implemented next."}
      </p>
    </div>
  );
}
"@ | Set-Content -Encoding UTF8 (Join-Path $pagesDir "AdminPlaceholderPage.tsx")

# Wire routes in App.tsx (replace file to keep it simple + explicit)
$appPath = Join-Path $src "App.tsx"

if (-not (Test-Path $appPath)) {
  throw "App.tsx not found at: $appPath"
}

@"
// keel-web/src/App.tsx
// Keel Shore Admin — App Shell (Now includes AdminLayout + /admin routes)
// - Light/Dark mode toggle persistence is handled in AdminTopbar
// - Global toaster remains here for app-wide feedback
// - We keep the file slightly verbose with helper comments for beginner friendliness

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AdminLayout } from "./admin/layout/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminPlaceholderPage } from "./admin/pages/AdminPlaceholderPage";

function applyThemeFromStorage() {
  // Helper: reads persisted theme and applies it at <html>
  const saved = localStorage.getItem("keel_theme");
  const isDark = saved === "dark";
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function App() {
  useEffect(() => {
    // Apply theme immediately on load so there is no flash
    applyThemeFromStorage();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Global toaster: success/error/info feedback across the entire Keel web app */}
      <Toaster richColors position="top-right" />

      <Routes>
        {/* Default route goes to Shore Admin */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admin routes (shell) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route
            path="vessel-types"
            element={<AdminPlaceholderPage title="Vessel Types" />}
          />
          <Route
            path="trb-task-matrix"
            element={<AdminPlaceholderPage title="TRB Task Matrix" />}
          />
          <Route
            path="imports"
            element={<AdminPlaceholderPage title="Template Imports" />}
          />
          <Route path="vessels" element={<AdminPlaceholderPage title="Vessels" />} />
          <Route
            path="assignments"
            element={<AdminPlaceholderPage title="Assignments" />}
          />
          <Route
            path="trainees"
            element={<AdminPlaceholderPage title="Trainees" />}
          />
          <Route
            path="issuance"
            element={<AdminPlaceholderPage title="Issuance & Certificates" />}
          />
          <Route
            path="users"
            element={<AdminPlaceholderPage title="Users & Roles" />}
          />
          <Route path="audit" element={<AdminPlaceholderPage title="Audit Logs" />} />
          <Route
            path="settings"
            element={<AdminPlaceholderPage title="Settings" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Global fallback */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  );
}
"@ | Set-Content -Encoding UTF8 $appPath

Write-Host "STEP 3 complete: Admin shell files created and App routes updated." -ForegroundColor Green
Write-Host "Now run: cd keel-web ; npm run dev" -ForegroundColor Cyan
