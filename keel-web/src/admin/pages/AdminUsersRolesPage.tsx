// keel-web/src/admin/pages/AdminUsersRolesPage.tsx
//
// Keel — Users & Roles (Authority Register — Phase 2.5 POLISHED)
// ----------------------------------------------------
// PURPOSE:
// - Declare system authority explicitly
// - Remove ambiguity around signing vs finalization
// - Provide audit-safe, read-only clarity
//
// IMPORTANT:
// - Read-only by design
// - No CRUD, no toggles
// - Roles are system-defined and enforced globally
//
// AUDIT NOTE:
// This screen exists to ANSWER QUESTIONS, not to manage users.

import {
  ShieldCheck,
  UserCog,
  Lock,
  Eye,
  PenTool,
  XCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* ROLE REGISTRY — ORDERED BY AUTHORITY                                        */
/* -------------------------------------------------------------------------- */
/*
  Visual order implies authority.
  Higher authority appears first intentionally.
*/
const roles = [
  {
    role: "Shore Admin",
    scope: "Company",
    canSignTRB: false,
    canLockTRB: true,
    auditAccess: "Full",
    cannot: "Cannot perform onboard training tasks",
  },
  {
    role: "Master",
    scope: "Vessel",
    canSignTRB: true,
    canLockTRB: true,
    auditAccess: "Read",
    cannot: "Cannot override Shore Admin policies",
  },
  {
    role: "Chief Engineer",
    scope: "Vessel",
    canSignTRB: true,
    canLockTRB: true,
    auditAccess: "Read",
    cannot: "Cannot modify task definitions",
  },
  {
    role: "CTO (Chief Officer / 2nd Engineer)",
    scope: "Vessel",
    canSignTRB: true,          // ✅ FIXED — CTO CAN SIGN
    canLockTRB: false,         // ❌ EXPLICITLY CANNOT FINALIZE
    auditAccess: "Read",
    cannot: "Cannot finalize Training Record Book",
  },
  {
    role: "Auditor (MMD / Class)",
    scope: "External",
    canSignTRB: false,
    canLockTRB: false,
    auditAccess: "Read-only",
    cannot: "Cannot sign or modify any record",
  },
];

/* -------------------------------------------------------------------------- */
/* CAPABILITY MATRIX — EXPLICIT, READ-ONLY                                     */
/* -------------------------------------------------------------------------- */
/*
  This matrix reinforces rules visually.
  It intentionally duplicates information for audit clarity.
*/
const capabilities = [
  {
    label: "TRB Signing",
    master: true,
    chiefEngineer: true,
    cto: true,
    shoreAdmin: false,
    auditor: false,
  },
  {
    label: "Final TRB Lock",
    master: true,
    chiefEngineer: true,
    cto: false,
    shoreAdmin: true,
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
];

/* -------------------------------------------------------------------------- */
/* ICON HELPERS — SEMANTIC, NOT DECORATIVE                                     */
/* -------------------------------------------------------------------------- */
function Yes() {
  return <PenTool size={14} className="text-green-600" />;
}

function Final() {
  return <Lock size={14} className="text-red-600" />;
}

function No() {
  return <XCircle size={14} className="text-slate-400" />;
}

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                         */
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
          System-defined authority roles and their enforced limitations.
        </p>
      </div>

      {/* ============================ ROLE REGISTRY ============================ */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="px-4 py-3 text-left font-medium w-[80px]">Role</th>
              <th className="px-4 py-3 text-left font-medium w-[80px]">Scope</th>
              <th className="px-4 py-3 text-center font-medium w-[80px]">Sign</th>
              <th className="px-4 py-3 text-center font-medium w-[80px]">Finalize</th>
              <th className="px-4 py-3 text-center font-medium w-[80px]">Audit</th>
              <th className="px-4 py-3 text-left font-medium w-[80px]">Explicit Restriction</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((r) => (
              <tr key={r.role} className="border-t border-[hsl(var(--border))]">
                <td className="px-4 py-3 font-medium">{r.role}</td>
                <td className="px-4 py-3">{r.scope}</td>

                <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                    {r.canSignTRB ? <Yes /> : <No />}
                </div>
                </td>


                <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                    {r.canLockTRB ? <Final /> : <No />}
                </div>
                </td>


                <td className="px-4 py-3 text-center">{r.auditAccess}</td>

                <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                  {r.cannot}
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
          Capability Matrix (Read-only Reference)
        </h2>

        <table className="w-full text-sm table-fixed">
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
              <tr key={c.label} className="border-t border-[hsl(var(--border))]">
                <td className="py-2">{c.label}</td>
                <td className="text-center"><div className="flex items-center justify-center">{c.master ? <Yes /> : <No />}</div></td>
                <td className="text-center"><div className="flex items-center justify-center">{c.chiefEngineer ? <Yes /> : <No />}</div></td>
                <td className="text-center"><div className="flex items-center justify-center">{c.cto ? <Yes /> : <No />}</div></td>
                <td className="text-center"><div className="flex items-center justify-center">{c.shoreAdmin ? <Yes /> : <No />}</div></td>
                <td className="text-center"><div className="flex items-center justify-center">{c.auditor ? <Eye size={14} /> : <No />} </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================ DISCLAIMER ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Role capabilities are enforced system-wide, audited, and cannot be
        overridden at vessel or user level. This register exists to provide
        explicit authority transparency.
      </p>
    </div>
  );
}
