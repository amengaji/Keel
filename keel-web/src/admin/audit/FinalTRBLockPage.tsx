// keel-web/src/admin/audit/FinalTRBLockPage.tsx
//
// Keel — Final TRB Lock & Certification (Audit-Grade)
// ----------------------------------------------------
// MODULE: 2.4E — Audit Log Entry
//
// PURPOSE:
// - Permanently lock TRB
// - Generate immutable audit log record
// - Display authority, timestamp, hash
// - Redirect to Dashboard after ceremony
//
// IMPORTANT:
// - UX + state only
// - No backend calls
// - Legal / compliance tone

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSignatureVault } from "../security/SignatureVaultContext";

/* -------------------------------------------------------------------------- */
/* Card Primitive                                                              */
/* -------------------------------------------------------------------------- */
function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        p-6
        shadow-[0_2px_6px_rgba(0,0,0,0.6)]
        ring-1 ring-white/10
      "
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mock TRB Data                                                               */
/* -------------------------------------------------------------------------- */
const trbMeta = {
  cadet: "Rahul Sharma",
  category: "Deck Cadet",
  vessel: "MV Ocean Pioneer",
  imo: "IMO 9876543",
  period: "Jan 2026 – Jun 2026",
};

/* -------------------------------------------------------------------------- */
/* Mock Hash + Audit Log                                                       */
/* -------------------------------------------------------------------------- */
const auditHash = "9F3A-D2E1-A7C4-B990";

export function FinalTRBLockPage() {
  const navigate = useNavigate();
  const { isUnlocked, unlockedRole } = useSignatureVault();

  const [confirmed, setConfirmed] = useState(false);
  const [locked, setLocked] = useState(false);

  const lockedAt = "20 Jun 2026 · 16:42 IST";
  const lockedBy = unlockedRole ?? "UNKNOWN";

  /* ------------------------------------------------------------------------ */
  /* Redirect after completion                                                */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!locked) return;

    const t = setTimeout(() => {
      navigate("/admin/dashboard");
    }, 3500);

    return () => clearTimeout(t);
  }, [locked, navigate]);

  /* ------------------------------------------------------------------------ */
  /* Lock Handler                                                             */
  /* ------------------------------------------------------------------------ */
  function lockTRB() {
    if (!isUnlocked) {
      toast.error("Shore authority unlock required");
      return;
    }

    if (!confirmed) {
      toast.error("Compliance confirmation required");
      return;
    }

    setLocked(true);
    toast.success("Training Record Book locked and logged");
  }

  /* ------------------------------------------------------------------------ */
  /* SUCCESS + AUDIT LOG                                                       */
  /* ------------------------------------------------------------------------ */
  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-semibold text-center">
            TRB Successfully Locked
          </h1>

          {/* SUMMARY */}
          <Card>
            <div className="text-sm space-y-1">
              <div><strong>Cadet:</strong> {trbMeta.cadet}</div>
              <div><strong>Vessel:</strong> {trbMeta.vessel}</div>
              <div>
                <strong>Status:</strong>{" "}
                <span className="text-green-500">
                  Finalized & Immutable
                </span>
              </div>
            </div>
          </Card>

          {/* AUDIT LOG ENTRY */}
          <Card>
            <div className="text-sm font-medium mb-3">
              Audit Log Entry
            </div>

            <div className="text-sm space-y-2">
              <div>
                <strong>Action:</strong> Training Record Book Locked
              </div>
              <div>
                <strong>Locked By:</strong> {lockedBy}
              </div>
              <div>
                <strong>Timestamp:</strong> {lockedAt}
              </div>
              <div>
                <strong>TRB Period:</strong> {trbMeta.period}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Cryptographic Hash: {auditHash}
              </div>
            </div>
          </Card>

          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            Redirecting to dashboard…
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* CEREMONY PAGE                                                            */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-2xl font-semibold text-center">
          Final Lock & Audit Logging
        </h1>

        <Card>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Cadet:</strong> {trbMeta.cadet}</div>
            <div><strong>Category:</strong> {trbMeta.category}</div>
            <div><strong>Vessel:</strong> {trbMeta.vessel}</div>
            <div><strong>IMO:</strong> {trbMeta.imo}</div>
            <div><strong>Period:</strong> {trbMeta.period}</div>
          </div>
        </Card>

        <Card>
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I confirm this TRB is complete, compliant, and ready
              for permanent audit locking.
            </span>
          </label>
        </Card>

        <div className="flex justify-center">
          <button
            onClick={lockTRB}
            className="
              px-6 py-3 rounded-md
              bg-[hsl(var(--primary))]
              text-[hsl(var(--primary-foreground))]
              hover:opacity-90
            "
          >
            LOCK, LOG & SEAL TRB
          </button>
        </div>
      </div>
    </div>
  );
}
