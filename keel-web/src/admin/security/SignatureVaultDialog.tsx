// keel-web/src/admin/security/SignatureVaultDialog.tsx
//
// Signature Vault Dialog — Phase 2.1 (UX Only)
//
// PURPOSE:
// - Simple, fast PIN unlock dialog (no shadcn dependency)
// - Officer-friendly: big touch targets, clear status, minimal steps
//
// NOTE:
// - This is intentionally plain and stable for audit-grade UI.
// - We can enhance visuals later once logic is proven.

import { useMemo, useState } from "react";
import { useSignatureVault } from "./SignatureVaultContext";

export function SignatureVaultDialog() {
  const {
    isDialogOpen,
    closeDialog,
    unlockWithPin,
    dialogRole,
  } = useSignatureVault();

  const [pin, setPin] = useState("");

  const title = useMemo(() => {
    if (!dialogRole) return "Unlock Signature";
    return dialogRole === "MASTER" ? "Unlock Master Signature" : "Unlock CTO Signature";
  }, [dialogRole]);

  if (!isDialogOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/60
        flex items-center justify-center
        p-4
      "
      aria-modal="true"
      role="dialog"
    >
      <div
        className="
          w-full max-w-md
          rounded-xl
          bg-[hsl(var(--card))]
          text-[hsl(var(--foreground))]
          shadow-[0_1px_2px_rgba(0,0,0,0.4),0_14px_40px_rgba(0,0,0,0.65)]
          ring-1 ring-white/10
        "
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Enter your secure PIN to unlock signing for this session.
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="text-sm">
            Role:{" "}
            <span className="font-medium">
              {dialogRole ?? "Not selected"}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium">PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="Enter PIN"
              className="
                mt-2 w-full
                rounded-md
                border border-[hsl(var(--border))]
                bg-[hsl(var(--background))]
                px-3 py-2
                outline-none
                focus:ring-2 focus:ring-[hsl(var(--primary))]
              "
            />
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
              Phase 2A mock PIN is configured in code for now.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[hsl(var(--border))] flex items-center justify-end gap-2">
          <button
            className="
              px-4 py-2 rounded-md
              bg-[hsl(var(--muted))]
              hover:opacity-80
            "
            onClick={() => {
              setPin("");
              closeDialog();
            }}
          >
            Cancel
          </button>

          <button
            className="
              px-4 py-2 rounded-md
              bg-[hsl(var(--primary))]
              text-[hsl(var(--primary-foreground))]
              hover:opacity-90
            "
            onClick={() => {
              const ok = unlockWithPin(pin);
              if (ok) setPin("");
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
