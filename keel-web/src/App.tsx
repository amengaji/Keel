// keel-web/src/App.tsx
// Keel Shore Admin — App Shell

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AdminLayout } from "./admin/layout/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminPlaceholderPage } from "./admin/pages/AdminPlaceholderPage";
import { AdminApprovalsPage } from "./admin/pages/AdminApprovalsPage";
import { AdminVesselsPage } from "./admin/pages/AdminVesselsPage";
import { AdminVesselDetailPage } from "./admin/pages/AdminVesselDetailPage";

import { AuditLayout } from "./admin/audit/AuditLayout";
import { AuditLandingPage } from "./admin/audit/AuditLandingPage";
import { AuditTRBPage } from "./admin/audit/AuditTRBPage";
import { FinalTRBLockPage } from "./admin/audit/FinalTRBLockPage";

function applyThemeFromStorage() {
  const saved = localStorage.getItem("keel_theme");
  const root = document.documentElement;
  if (saved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function App() {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Toaster richColors position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Audit Mode */}
        <Route path="/admin/audit-mode" element={<AuditLayout />}>
          <Route index element={<AuditLandingPage />} />
          <Route path="trb" element={<AuditTRBPage />} />

          {/* Final TRB Lock can be reached from Audit Mode */}
          <Route path="final-lock" element={<FinalTRBLockPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />

          {/* === Module 2.4 === */}
          <Route
            path="pending-signatures"
            element={<AdminApprovalsPage />}
          />
          <Route
            path="rejected"
            element={
              <AdminPlaceholderPage title="Rejected / Returned" />
            }
          />
          <Route 
            path="vessels" 
            element={<AdminVesselsPage />} 
          />
          <Route
            path="vessels/:vesselId"
            element={<AdminVesselDetailPage />}
          />


          {/* Existing placeholders */}
          <Route path="audit" element={<AdminPlaceholderPage title="Audit Logs" />} />
          <Route path="settings" element={<AdminPlaceholderPage title="Settings" />} />

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  );
}
