// keel-web/src/App.tsx
// Keel Shore Admin â€” App Shell (Now includes AdminLayout + /admin routes)
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
