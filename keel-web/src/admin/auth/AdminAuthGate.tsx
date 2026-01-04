// keel-web/src/admin/auth/AdminAuthGate.tsx
//
// Keel — Admin Authentication Gate
// ----------------------------------------------------
// PURPOSE:
// - Protect all /admin/* routes
// - Verify active session using /me
// - Redirect unauthenticated users to /admin/login
// - Provide a single logout() helper for UI
//
// IMPORTANT:
// - Cookie-based auth only (HttpOnly)
// - No token storage in frontend
// - Audit-safe, read-only friendly
//
// FLOW:
// 1. On mount → call /me
// 2. If 200 → allow render
// 3. If 401/403 → redirect to /admin/login

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

type AdminAuthGateProps = {
  children: React.ReactNode;
};

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/me", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        setAuthenticated(true);
      } catch {
        toast.error("Session expired. Please log in again.");
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, []);

  // While checking session → block UI
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Verifying session…
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated → render admin UI
  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/* Logout helper (shared across UI)                                            */
/* -------------------------------------------------------------------------- */
export async function adminLogout() {
  try {
    await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors during logout
  } finally {
    toast.success("Logged out successfully");
    window.location.href = "/admin/login";
  }
}
