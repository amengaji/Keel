// keel-web/src/admin/security/SignatureVaultContext.tsx
//
// Keel — Signature Vault Context (Phase 2.4)
// ----------------------------------------------------
// PURPOSE:
// - Central authority “unlock” state (Master / CTO / etc.)
// - Session-limited unlock (PIN-based UX only)
// - Provides guard helpers for actions like TRB locking
//
// IMPORTANT:
// - UX + state only (no backend)
// - Secure PIN validation is mock
// - Production: unlock should be backed by device biometrics + server policy

import React, { createContext, useContext, useMemo, useState } from "react";

export type VaultUnlockRole =
  | "MASTER"
  | "CHIEF_ENGINEER"
  | "CTO"
  | "SHORE_ADMIN"
  | null;

// Your domain correction:
// CTO means different physical ranks based on trainee category.
// We keep the “unlock” label as CTO,
// but expose an “effective authority” role for audit logging.
export type TraineeCategory =
  | "DECK_CADET"
  | "ENGINE_CADET"
  | "ETO_CADET"
  | "DECK_RATING"
  | "ENGINE_RATING";

type SignatureVaultContextValue = {
  // Session state
  isUnlocked: boolean;
  unlockedRole: VaultUnlockRole;

  // Dialog control (your existing UX)
  isDialogOpen: boolean;
  dialogRole: Exclude<VaultUnlockRole, null> | null;
  openDialog: (role: Exclude<VaultUnlockRole, null>) => void;
  closeDialog: () => void;

  // Unlock / Lock actions
  unlockWithPin: (pin: string) => boolean;
  lockNow: () => void;

  // UX helper: remaining minutes (optional)
  getRemainingMinutes: () => number | null;

  // Authority helpers (Phase 2.4)
  getEffectiveAuthorityRole: (category: TraineeCategory) => string;
  canFinalizeTRB: (category: TraineeCategory) => boolean;
};

const SignatureVaultContext = createContext<SignatureVaultContextValue | null>(
  null
);

export function SignatureVaultProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // -------------------------------------------------------------------------
  // Core session state
  // -------------------------------------------------------------------------
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedRole, setUnlockedRole] = useState<VaultUnlockRole>(null);

  // Dialog state (PIN entry UI)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogRole, setDialogRole] =
    useState<Exclude<VaultUnlockRole, null> | null>(null);

  // Session timer (mock)
  const [unlockedAtMs, setUnlockedAtMs] = useState<number | null>(null);
  const sessionMinutes = 15;

  // -------------------------------------------------------------------------
  // Dialog control
  // -------------------------------------------------------------------------
  function openDialog(role: Exclude<VaultUnlockRole, null>) {
    setDialogRole(role);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setDialogRole(null);
  }

  // -------------------------------------------------------------------------
  // Unlock logic (PIN-based mock)
  // -------------------------------------------------------------------------
  function unlockWithPin(pin: string): boolean {
    // IMPORTANT: Mock PIN logic for Phase 2.1/2.4
    // Production: validate via secure credential store and/or backend.
    const normalized = pin.trim();

    if (!dialogRole) return false;

    // Simple mock: any 4+ digit pin unlocks
    const ok = /^[0-9]{4,}$/.test(normalized);

    if (!ok) return false;

    setIsUnlocked(true);
    setUnlockedRole(dialogRole);
    setUnlockedAtMs(Date.now());

    closeDialog();
    return true;
  }

  function lockNow() {
    setIsUnlocked(false);
    setUnlockedRole(null);
    setUnlockedAtMs(null);
    closeDialog();
  }

  // -------------------------------------------------------------------------
  // Session minutes helper
  // -------------------------------------------------------------------------
  function getRemainingMinutes(): number | null {
    if (!isUnlocked || !unlockedAtMs) return null;

    const elapsedMs = Date.now() - unlockedAtMs;
    const elapsedMin = Math.floor(elapsedMs / 60000);

    const remaining = sessionMinutes - elapsedMin;
    return remaining > 0 ? remaining : 0;
  }

  // -------------------------------------------------------------------------
  // Authority mapping (your domain rule)
  // -------------------------------------------------------------------------
  function getEffectiveAuthorityRole(category: TraineeCategory): string {
    // PURPOSE:
    // - If someone unlocked as CTO, we translate to the real authority label
    //   for audit logs. This is critical for MMD/DG Shipping trust.
    if (!unlockedRole) return "UNKNOWN";

    if (unlockedRole === "MASTER") return "MASTER";
    if (unlockedRole === "CHIEF_ENGINEER") return "CHIEF_ENGINEER";
    if (unlockedRole === "SHORE_ADMIN") return "SHORE_ADMIN";

    // unlockedRole === "CTO"
    if (category === "DECK_CADET") return "CTO_DECK (Chief Officer)";
    if (category === "ENGINE_CADET") return "CTO_ENGINE (2nd Engineer)";
    if (category === "ETO_CADET") return "CTO_ETO (Chief Engineer)";
    if (category === "DECK_RATING") return "CTO_DECK_RATING (Assigned Officer)";
    if (category === "ENGINE_RATING") return "CTO_ENGINE_RATING (Assigned Officer)";

    return "CTO";
  }

  function canFinalizeTRB(_category: TraineeCategory): boolean {
    // PURPOSE:
    // - Final TRB lock is a legal / finality action.
    // - Only certain authorities can perform it.
    //
    // For now (Phase 2.4 mock), we allow:
    // - SHORE_ADMIN always
    // - MASTER always
    // - CHIEF_ENGINEER always
    //
    // CTO alone should NOT finalize the TRB.
    if (!isUnlocked || !unlockedRole) return false;

    if (unlockedRole === "SHORE_ADMIN") return true;
    if (unlockedRole === "MASTER") return true;
    if (unlockedRole === "CHIEF_ENGINEER") return true;

    // CTO is training approval, not final lock
    if (unlockedRole === "CTO") return false;

    // Default safe
    return false;
  }

  const value = useMemo<SignatureVaultContextValue>(() => {
    return {
      isUnlocked,
      unlockedRole,

      isDialogOpen,
      dialogRole,
      openDialog,
      closeDialog,

      unlockWithPin,
      lockNow,

      getRemainingMinutes,

      getEffectiveAuthorityRole,
      canFinalizeTRB,
    };
  }, [isUnlocked, unlockedRole, isDialogOpen, dialogRole, unlockedAtMs]);

  return (
    <SignatureVaultContext.Provider value={value}>
      {children}
    </SignatureVaultContext.Provider>
  );
}

export function useSignatureVault(): SignatureVaultContextValue {
  const ctx = useContext(SignatureVaultContext);
  if (!ctx) {
    throw new Error(
      "useSignatureVault must be used within <SignatureVaultProvider>"
    );
  }
  return ctx;
}
