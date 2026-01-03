// keel-web/src/admin/pages/AdminPendingSignaturesPage.tsx
//
// Keel — Pending Signatures (Authority × TRB × Risk)
// ----------------------------------------------------
// PURPOSE:
// - Single source of truth for pending TRB signatures
// - Authority-aware (Master / CTO / Shore)
// - Risk-visible for audit exposure
//
// IMPORTANT:
// - Phase 2 UI/UX only
// - Mock data only
// - No backend calls
// - No real signing
// - Signature Vault UX only
//
// FUTURE PHASES (NOT IN THIS FILE):
// - Live signing
// - Escalation rules
// - SLA timers
// - Notifications

import { toast } from "sonner";
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

import { useSignatureVault } from "../security/SignatureVaultContext";

/* -------------------------------------------------------------------------- */
/* Mock Pending Signatures Data                                                */
/* -------------------------------------------------------------------------- */

// Authority roles must strictly match Signature Vault types
type AuthorityRole = "CTO" | "MASTER" | "CHIEF_ENGINEER" | "SHORE_ADMIN";


const pendingItems: {
  id: string;
  cadet: string;
  vessel: string;
  trbType: string;
  section: string;
  authority: AuthorityRole;
  ageDays: number;
  risk: "Low" | "Medium" | "High";
}[] = [
  {
    id: "p1",
    cadet: "Rahul Sharma",
    vessel: "MV Ocean Pioneer",
    trbType: "Deck — Operational",
    section: "Cargo Operations",
    authority: "CTO",
    ageDays: 3,
    risk: "Medium",
  },
  {
    id: "p2",
    cadet: "Neha Singh",
    vessel: "MV Eastern Light",
    trbType: "Deck — Operational",
    section: "Navigation Watch",
    authority: "MASTER",
    ageDays: 7,
    risk: "High",
  },
  {
    id: "p3",
    cadet: "Amit Verma",
    vessel: "MT Blue Horizon",
    trbType: "Engine — Operational",
    section: "Machinery Maintenance",
    authority: "CTO",
    ageDays: 1,
    risk: "Low",
  },
];


/* -------------------------------------------------------------------------- */
/* Helper — Risk Badge                                                         */
/* -------------------------------------------------------------------------- */
function RiskBadge({ risk }: { risk: string }) {
  if (risk === "High") {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600">
        High
      </span>
    );
  }

  if (risk === "Medium") {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-600">
        Medium
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600">
      Low
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper — Authority Badge                                                    */
/* -------------------------------------------------------------------------- */
function AuthorityBadge({ authority }: { authority: string }) {
  return (
    <span className="text-xs px-2 py-1 rounded-md bg-[hsl(var(--muted))]">
      {authority}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminPendingSignaturesPage() {
  const { isUnlocked, unlockedRole, openDialog } = useSignatureVault();

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileCheck size={20} />
            Pending Signatures
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Authority-specific TRB sign-offs awaiting completion.
          </p>
        </div>

        <button
          onClick={() =>
            toast.message("Signature escalation rules will be added in Phase 3")
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          aria-label="Pending signatures info"
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      {/* ============================ SUMMARY STRIP ============================ */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={<FileCheck size={18} />} label="Pending" value="3" />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          label="High Risk"
          value="1"
        />
        <SummaryCard
          icon={<UserCheck size={18} />}
          label="CTO Required"
          value="2"
        />
        <SummaryCard
          icon={<ShieldCheck size={18} />}
          label="Master Required"
          value="1"
        />
      </div>

      {/* ============================ MAIN TABLE ============================ */}
      <div
        className="
          overflow-hidden
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
        "
      >
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Cadet</th>
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-left font-medium">TRB Type</th>
              <th className="px-4 py-3 text-left font-medium">Section</th>
              <th className="px-4 py-3 text-center font-medium">Authority</th>
              <th className="px-4 py-3 text-center font-medium">Age</th>
              <th className="px-4 py-3 text-center font-medium">Risk</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {pendingItems.map((item) => {
              const canSign =
                isUnlocked && unlockedRole === item.authority;

              return (
                <tr
                  key={item.id}
                  className="
                    border-t border-[hsl(var(--border))]
                    hover:bg-[hsl(var(--muted))]
                  "
                >
                  <td className="px-4 py-3 font-medium">{item.cadet}</td>
                  <td className="px-4 py-3">{item.vessel}</td>
                  <td className="px-4 py-3">{item.trbType}</td>
                  <td className="px-4 py-3">{item.section}</td>

                  <td className="px-4 py-3 text-center">
                    <AuthorityBadge authority={item.authority} />
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.ageDays}d
                  </td>

                  <td className="px-4 py-3 text-center">
                    <RiskBadge risk={item.risk} />
                  </td>

                  <td className="px-4 py-3 text-center">
                    {canSign ? (
                      <button
                        onClick={() =>
                          toast.success(
                            `Signed by ${unlockedRole} (mock)`
                          )
                        }
                        className="
                          px-3 py-1.5
                          rounded-md
                          bg-[hsl(var(--primary))]
                          text-[hsl(var(--primary-foreground))]
                          hover:opacity-90
                        "
                      >
                        Sign
                      </button>
                    ) : (
                      <button
                        onClick={() => openDialog(item.authority)}
                        className="
                          px-3 py-1.5
                          rounded-md
                          border border-[hsl(var(--border))]
                          hover:bg-[hsl(var(--muted))]
                        "
                      >
                        Unlock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Signatures are controlled by the Signature Vault. Final TRB locking
        remains restricted to Master / Chief Engineer / Shore Admin.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card Component                                                      */
/* -------------------------------------------------------------------------- */
function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-lg
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        p-4
        space-y-2
      "
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
