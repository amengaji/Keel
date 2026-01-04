// keel-web/src/admin/pages/AdminLoginPage.tsx
//
// KEEL — Admin Login (Audit-Safe)
// ----------------------------------------------------
// PURPOSE:
// - Admin-only secure sign-in screen
// - Designed for compliance and audit environments
// - Uses KEEL theme tokens (light/dark supported)
//
// IMPORTANT:
// - NO signup flow (admins are provisioned)
// - NO social login (audit traceability)
// - NO token handling in UI (HttpOnly cookie model later)
// - This file is UI-first; backend wiring comes next step
//

import { useMemo, useState } from "react";
import {
  Anchor,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helper: Safe email check (UI only)                                         */
/* -------------------------------------------------------------------------- */
/**
 * Very lightweight client-side check to prevent obvious mistakes.
 * Server-side validation remains the source of truth.
 */
function isLikelyEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return v.includes("@") && v.includes(".");
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */
export function AdminLoginPage() {
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // UI-only feedback (backend wiring will replace this in next step)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Derived UI State                                                         */
  /* ------------------------------------------------------------------------ */
  const canSubmit = useMemo(() => {
    return isLikelyEmail(email) && password.trim().length >= 6 && !isSubmitting;
  }, [email, password, isSubmitting]);

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */
    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // -----------------------------------------------------------------------
    // Client-side guard (UX only — backend is source of truth)
    // -----------------------------------------------------------------------
    if (!canSubmit) {
        setFormError("Please enter a valid email and password.");
        return;
    }

    try {
        setIsSubmitting(true);
        setFormError(null);

        // ---------------------------------------------------------------------
        // CALL BACKEND LOGIN API
        // IMPORTANT:
        // - Uses HttpOnly cookie model
        // - Browser will store cookie automatically
        // - We do NOT touch tokens in UI
        // ---------------------------------------------------------------------
        const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include", // REQUIRED for cookie-based auth
        body: JSON.stringify({
            email: email.trim(),
            password: password,
        }),
        });

        let result: any = null;

        // Safely parse JSON only if response has content
        const text = await response.text();
        if (text) {
        result = JSON.parse(text);
        }

        // ---------------------------------------------------------------------
        // HANDLE FAILURE
        // ---------------------------------------------------------------------
        if (!response.ok) {
        throw new Error(result?.message || "Invalid email or password");
        }

        // ---------------------------------------------------------------------
        // HANDLE SUCCESS
        // ---------------------------------------------------------------------
        // At this point:
        // - Backend has validated credentials
        // - HttpOnly cookie is set in browser
        // - Admin is authenticated
        //
        // We now redirect to Admin Dashboard.
        window.location.href = "/admin/dashboard";
    } catch (err: any) {
        console.error("Admin login failed:", err);
        setFormError(err.message || "Invalid email or password");
    } finally {
        setIsSubmitting(false);
    }
    }


  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ====================================================================== */}
      {/* Split Layout                                                           */}
      {/* ====================================================================== */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* ==================================================================== */}
        {/* LEFT: Brand / Message                                                 */}
        {/* ==================================================================== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
          {/* Soft gradient panel that adapts to light/dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--muted))] via-[hsl(var(--background))] to-[hsl(var(--muted))]" />

          {/* Keel color accent */}
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-25 bg-[hsl(var(--primary))]" />
          <div className="absolute -bottom-48 -right-48 h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-[hsl(var(--primary))]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[hsl(var(--primary))] text-white shadow-sm">
                <Anchor size={20} />
              </div>

              <div>
                <div className="text-lg font-semibold leading-tight">
                  KEEL
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Maritime Training & e-TRB System
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-3xl font-semibold leading-tight">
                Secure Admin Access
              </h2>

              <p className="mt-3 max-w-md text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                Administrative access is restricted to authorised personnel.
                All sensitive actions are recorded and available for audit review.
              </p>

              <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-[hsl(var(--primary))]" size={18} />
                  <div>
                    <div className="text-sm font-medium">
                      Audit-safe design
                    </div>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                      No self-registration. No social logins. Controlled access only.
                      This supports traceability under STCW/ISM expectations.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-xs text-[hsl(var(--muted-foreground))]">
                Tip: Use your company-admin credentials (provisioned by your system administrator).
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} KEEL. All rights reserved.
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT: Login Form                                                     */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            {/* Mobile brand header (since left panel is hidden) */}
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[hsl(var(--primary))] text-white shadow-sm">
                  <Anchor size={20} />
                </div>
                <div>
                  <div className="text-lg font-semibold leading-tight">
                    KEEL
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Maritime Training & e-TRB System
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
              {/* Title */}
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[hsl(var(--primary))]" size={18} />
                <h1 className="text-lg font-semibold">
                  Admin Login
                </h1>
              </div>

              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Sign in to manage vessel data, cadets, assignments, and audit records.
              </p>

              {/* Error banner (UI-only, real errors in next step) */}
              {formError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                  {formError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@keel.com"
                    autoComplete="email"
                    className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  />
                  <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Use your provisioned Admin email.
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Minimum 6 characters (server rules may be stricter).
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "w-full rounded-md px-4 py-2 text-sm font-medium text-white transition",
                    "bg-[hsl(var(--primary))] hover:opacity-90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2",
                  ].join(" ")}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>

                {/* Footer hint */}
                <div className="pt-3 text-xs text-center text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Authorized personnel only. All access is logged for audit purposes.
                </div>
              </form>
            </div>

            {/* Bottom microcopy */}
            <div className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Having trouble? Contact your company system administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
