// keel-web/src/admin/layout/AdminLayout.tsx
// Shore Admin â€” Layout Shell
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
