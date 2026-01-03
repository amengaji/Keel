// keel-web/src/admin/pages/AdminUsersRolesPage.tsx
//
// Keel — Users & Roles (Authority Register)
// ----------------------------------------------------
// PURPOSE:
// - System-level authority definition
// - Audit-safe role visibility
// - Explains who can do what (and who cannot)
//
// IMPORTANT:
// - Read-only by design
// - No CRUD
// - No user-level assignments
// - Roles are system-defined and enforced globally
//
// AUDIT NOTE:
// This screen exists to answer regulatory questions,
// not to manage users.

import {
  ShieldCheck,
  UserCog,
  Lock,
  Eye,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Role Registry — SYSTEM DEFINED                                              */
/* -------------------------------------------------------------------------- */
const roles = [
  {
    role: "Master",
    scope: "Vessel",
    canSignTRB: true,
    canLockTRB: true,
    auditAccess: "Read",
  },
  {
    role: "Chief Engineer",
    scope: "Vessel",
    canSignTRB: true,
    canLockTRB: false,
    auditAccess: "Read",
  },
  {
    role: "CTO",
    scope: "Fleet",
    canSignTRB: false,
    canLockTRB: false,
    auditAccess: "Read",
  },
  {
    role: "Shore Admin",
    scope: "Company",
    canSignTRB: false,
    canLockTRB: false,
    auditAccess: "Full",
  },
  {
    role: "Auditor (MMD / Class)",
    scope: "External",
    canSignTRB: false,
    canLockTRB: false,
    auditAccess: "Read-only",
  },
];

/* -------------------------------------------------------------------------- */
/* Capability Matrix                                                           */
/* -------------------------------------------------------------------------- */
const capabilities = [
  {
    label: "TRB Signing",
    master: true,
    chiefEngineer: true,
    cto: false,
    shoreAdmin: false,
    auditor: false,
  },
  {
    label: "Final TRB Lock",
    master: true,
    chiefEngineer: false,
    cto: false,
    shoreAdmin: false,
    auditor: false,
  },
  {
    label: "Audit Mode Access",
    master: false,
    chiefEngineer: false,
    cto: true,
    shoreAdmin: true,
    auditor: true,
  },
  {
    label: "Evidence Visibility",
    master: true,
    chiefEngineer: true,
    cto: true,
    shoreAdmin: true,
    auditor: true,
  },
  {
    label: "Cadet Assignment",
    master: false,
    chiefEngineer: false,
    cto: false,
    shoreAdmin: true,
    auditor: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminUsersRolesPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <UserCog size={20} />
          Users & Roles
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          System-defined authority roles and their permitted actions.
        </p>
      </div>

      {/* ============================ ROLE REGISTRY ============================ */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Authority Scope</th>
              <th className="px-4 py-3 text-center font-medium">TRB Sign</th>
              <th className="px-4 py-3 text-center font-medium">Final Lock</th>
              <th className="px-4 py-3 text-center font-medium">Audit Access</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr
                key={r.role}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="px-4 py-3 font-medium">{r.role}</td>
                <td className="px-4 py-3">{r.scope}</td>

                <td className="px-4 py-3 text-center">
                  {r.canSignTRB ? "✓" : "—"}
                </td>

                <td className="px-4 py-3 text-center">
                  {r.canLockTRB ? <Lock size={14} /> : "—"}
                </td>

                <td className="px-4 py-3 text-center">
                  {r.auditAccess}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ CAPABILITY MATRIX ============================ */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
          <ShieldCheck size={16} />
          Capability Matrix
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-[hsl(var(--muted-foreground))]">
              <th className="text-left py-2">Capability</th>
              <th className="text-center">Master</th>
              <th className="text-center">Chief Eng.</th>
              <th className="text-center">CTO</th>
              <th className="text-center">Shore Admin</th>
              <th className="text-center">Auditor</th>
            </tr>
          </thead>

          <tbody>
            {capabilities.map((c) => (
              <tr
                key={c.label}
                className="border-t border-[hsl(var(--border))]"
              >
                <td className="py-2">{c.label}</td>
                <td className="text-center">{c.master ? "✓" : "—"}</td>
                <td className="text-center">{c.chiefEngineer ? "✓" : "—"}</td>
                <td className="text-center">{c.cto ? "✓" : "—"}</td>
                <td className="text-center">{c.shoreAdmin ? "✓" : "—"}</td>
                <td className="text-center">{c.auditor ? <Eye size={14} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ DISCLAIMER ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Role capabilities are enforced system-wide and cannot be overridden
        at the vessel or user level. This register is read-only and intended
        for audit transparency.
      </p>
    </div>
  );
}
