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
import { AdminCadetsPage } from "./admin/pages/AdminCadetsPage";
import { AdminCadetDetailPage } from "./admin/pages/AdminCadetDetailPage";
import { AdminCadetProfilePage } from "./admin/pages/AdminCadetProfilePage";
import { AdminVesselCreatePage } from "./admin/pages/AdminVesselCreatePage";
import { AdminTraineeCreatePage } from "./admin/pages/AdminTraineeCreatePage";
import { AuditLayout } from "./admin/audit/AuditLayout";
import { AuditLandingPage } from "./admin/audit/AuditLandingPage";
import { AuditTRBPage } from "./admin/audit/AuditTRBPage";
import { FinalTRBLockPage } from "./admin/audit/FinalTRBLockPage";
import { AdminTrainingProgressPage } from "./admin/pages/AdminTrainingProgressPage";
import { AdminLockedTRBsPage } from "./admin/pages/AdminLockedTRBsPage";
import { AdminEvidenceRepositoryPage } from "./admin/pages/AdminEvidenceRepositoryPage";
import { AdminAssignmentHistoryPage } from "./admin/pages/AdminAssignmentHistoryPage";
import { AdminReportsPage } from "./admin/pages/AdminReportsPage";
import { AdminTRBStatusReportPage } from "./admin/pages/reports/AdminTRBStatusReportPage"
import { AdminAuditReadinessReportPage } from "./admin/pages/reports/AdminAuditReadinessReportPage";
import { AdminEvidenceCompletenessReportPage } from "./admin/pages/reports/AdminEvidenceCompletenessReportPage";
import { AdminUsersRolesPage } from "./admin/pages/AdminUsersRolesPage";
import { AdminVesselTypesPage } from "./admin/pages/AdminVesselTypesPage"
import { AdminImportsPage } from "./admin/pages/AdminImportsPage";
import { AdminSystemSettingsPage } from "./admin/pages/AdminSystemSettingsPage";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminAuthGate } from "./admin/auth/AdminAuthGate";


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

        
      {/* ============================ */}
      {/* Admin Login (NO LAYOUT)      */}
      {/* ============================ */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Audit Mode */}
        <Route path="/admin/audit-mode" element={<AuditLayout />}>
          <Route index element={<AuditLandingPage />} />
          <Route path="trb" element={<AuditTRBPage />} />

          {/* Final TRB Lock can be reached from Audit Mode */}
          <Route path="final-lock" element={<FinalTRBLockPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminAuthGate><AdminLayout /></AdminAuthGate>}>


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
          <Route
            path="vessels/create"
            element={<AdminVesselCreatePage />}
          />

          {/* Cadets */}
          <Route
            path="cadets"
            element={<AdminCadetsPage />}
          />
          <Route
            path="cadets/create"
            element={<AdminTraineeCreatePage />}
          />
          {/* NEW: Cadet Identity Profile (Phase 3A) */}
          <Route
            path="cadets/:cadetId/profile"
            element={<AdminCadetProfilePage />}
          />          
          <Route
            path="cadets/:cadetId"
            element={<AdminCadetDetailPage />}
          />
          <Route
            path="training-progress"
            element={<AdminTrainingProgressPage/>}
          />

          {/* Compliance register (Phase 2.5) */}
          <Route
            path="locked-trbs"
            element={<AdminLockedTRBsPage />}
          />
          <Route
            path="evidence"
            element={<AdminEvidenceRepositoryPage />}
          />
          <Route
            path="assignments"
            element={<AdminAssignmentHistoryPage />}
          />
          <Route
            path="reports"
            element={<AdminReportsPage />}
          />
          <Route
            path="reports/trb-status"
            element={<AdminTRBStatusReportPage />}
          />
          <Route
            path="reports/audit-readiness"
            element={<AdminAuditReadinessReportPage />}
          />
          <Route
            path="reports/evidence-completeness"
            element={<AdminEvidenceCompletenessReportPage />}
          />
          <Route
            path="users"
            element={<AdminUsersRolesPage />}
          />
          <Route
            path="vessel-types"
            element={<AdminVesselTypesPage/>}
          />
          <Route
            path="imports"
            element={<AdminImportsPage/>}
          />
          <Route
            path="settings"
            element={<AdminSystemSettingsPage/>}
          />
          {/* Existing placeholders */}
          <Route path="audit" element={<AdminPlaceholderPage title="Audit Logs" />} />

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  );
}
