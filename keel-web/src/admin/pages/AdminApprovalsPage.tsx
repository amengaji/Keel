// keel-web/src/admin/pages/AdminApprovalsPage.tsx
//
// Keel — Pending Signatures (Dual Authority Enforcement)
// ----------------------------------------------------
// MODULE: 2.4C
//
// PURPOSE:
// - Enforce Master + CTO dual signature
// - Evidence-first approval
// - Prevent single-point authority
//
// RULES:
// - Evidence must be reviewed
// - Both signatures required
// - UX-only (no backend)

import { useState } from "react";
import { toast } from "sonner";
import { useSignatureVault } from "../security/SignatureVaultContext";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Card Primitive                                                              */
/* -------------------------------------------------------------------------- */
function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        p-5
        shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(0,0,0,0.6)]
        ring-1 ring-white/10
      "
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mock Pending Approval Records                                               */
/* -------------------------------------------------------------------------- */
const pendingApprovals = [
  {
    id: "A-001",
    cadet: "Rahul Sharma",
    vessel: "MV Ocean Pioneer",
    task: "1.1 Maintain a safe navigational watch",
    submittedOn: "10 Jan 2026",
    report:
      "Performed lookout duties during night watch, monitored traffic using radar and visual bearings.",
  },
];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
export function AdminApprovalsPage() {
  const { isUnlocked, unlockedRole } = useSignatureVault();

  /* ------------------------------------------------------------------------ */
  /* Local UX State                                                           */
  /* ------------------------------------------------------------------------ */
  const [evidenceViewed, setEvidenceViewed] = useState<
    Record<string, boolean>
  >({});

  const [signatures, setSignatures] = useState<
    Record<
      string,
      {
        master: boolean;
        cto: boolean;
      }
    >
  >({});

  /* ------------------------------------------------------------------------ */
  /* Evidence Handling                                                        */
  /* ------------------------------------------------------------------------ */
  function markEvidenceViewed(id: string) {
    setEvidenceViewed((prev) => ({
      ...prev,
      [id]: true,
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Signature Handling                                                       */
  /* ------------------------------------------------------------------------ */
  function signRecord(id: string) {
    if (!isUnlocked || !unlockedRole) {
      toast.error("Unlock Master or CTO to sign");
      return;
    }

    if (!evidenceViewed[id]) {
      toast.error("Evidence must be reviewed before signing");
      return;
    }

    setSignatures((prev) => {
      const current = prev[id] || { master: false, cto: false };

      if (unlockedRole === "MASTER") {
        current.master = true;
        toast.success("Master signature applied (mock)");
      }

      if (unlockedRole === "CTO") {
        current.cto = true;
        toast.success("CTO signature applied (mock)");
      }

      return {
        ...prev,
        [id]: { ...current },
      };
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="space-y-8">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-2xl font-semibold">
          Pending Signatures
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Dual authority approval required (Master + CTO)
        </p>
      </div>

      {/* ============================ LIST ============================ */}
      {pendingApprovals.map((item) => {
        const evidenceSeen = evidenceViewed[item.id];
        const recordSignatures = signatures[item.id] || {
          master: false,
          cto: false,
        };

        const fullySigned =
          recordSignatures.master && recordSignatures.cto;

        return (
          <Card key={item.id}>
            <div className="space-y-4">
              {/* HEADER */}
              <div>
                <div className="font-medium">
                  {item.task}
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {item.cadet} · {item.vessel}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Submitted: {item.submittedOn}
                </div>
              </div>

              {/* EVIDENCE */}
              <div className="grid grid-cols-[160px_1fr] gap-4">
                <div
                  className="
                    h-28 rounded-md
                    bg-[hsl(var(--muted))]
                    flex items-center justify-center
                    text-xs cursor-pointer
                    hover:opacity-80
                  "
                  onClick={() => markEvidenceViewed(item.id)}
                >
                  Evidence Preview
                </div>

                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {item.report}
                </div>
              </div>

              {/* STATUS ROW */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-xs">
                  <div>
                    Evidence:{" "}
                    {evidenceSeen ? (
                      <span className="text-green-500">
                        Reviewed
                      </span>
                    ) : (
                      <span className="text-yellow-400">
                        Not Reviewed
                      </span>
                    )}
                  </div>

                  <div>
                    Master:{" "}
                    {recordSignatures.master ? (
                      <span className="text-green-500">
                        Signed
                      </span>
                    ) : (
                      <span className="text-yellow-400">
                        Pending
                      </span>
                    )}
                  </div>

                  <div>
                    CTO:{" "}
                    {recordSignatures.cto ? (
                      <span className="text-green-500">
                        Signed
                      </span>
                    ) : (
                      <span className="text-yellow-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={() => signRecord(item.id)}
                  disabled={fullySigned}
                  className="
                    px-4 py-2 rounded-md
                    bg-[hsl(var(--primary))]
                    text-[hsl(var(--primary-foreground))]
                    hover:opacity-90
                    disabled:opacity-40
                  "
                >
                  {fullySigned ? "Fully Signed" : "Sign Record"}
                </button>
              </div>

              {!isUnlocked && (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Unlock Master or CTO to sign
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
