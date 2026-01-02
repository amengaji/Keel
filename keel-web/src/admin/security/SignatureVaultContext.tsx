// keel-web/src/admin/security/SignatureVaultContext.tsx
//
// Signature Vault — Phase 2.1 (UX + State Only)
//
// PURPOSE (Maritime UX):
// - Master/CTO unlocks once per session (PIN)
// - After unlock, app can apply “stored signature” actions without repeated prompts
// - Session auto-expires (officers hand over devices / shift changes)
//
// SECURITY NOTE (Phase 2A):
// - This is UI/state only. No backend, no crypto, no biometrics.
// - PIN is a mock placeholder and MUST be replaced later with real policy/backend.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SignatureRole = "MASTER" | "CTO";

type SignatureVaultState = {
  unlockedRole: SignatureRole | null;
  expiresAtMs: number | null;
};

type SignatureVaultContextValue = {
  // Current session state
  isUnlocked: boolean;
  unlockedRole: SignatureRole | null;
  expiresAtMs: number | null;

  // UI control
  isDialogOpen: boolean;
  openDialog: (role: SignatureRole) => void;
  closeDialog: () => void;

  // Session operations
  unlockWithPin: (pin: string) => boolean;
  lockNow: () => void;

  // Readable display helper
  getRemainingMinutes: () => number | null;

  // Selected role to unlock (chosen by user before entering PIN)
  requestedRole: SignatureRole | null;
};

/* -------------------------------------------------------------------------- */
/* Configuration (Phase 2A)                                                   */
/* -------------------------------------------------------------------------- */

// IMPORTANT: Replace this with backend policy later.
// For now we keep a simple default PIN for UX testing.
const DEFAULT_MOCK_PIN = "1234";

// Session duration after successful unlock (minutes).
// Maritime rationale: long enough for a coffee-break approval batch,
// short enough to reduce risk on shared devices.
const SESSION_DURATION_MIN = 20;

// LocalStorage key for session persistence across refreshes.
const STORAGE_KEY = "keel_signature_vault_session_v1";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function nowMs(): number {
  return Date.now();
}

function loadSession(): SignatureVaultState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedRole: null, expiresAtMs: null };
    const parsed = JSON.parse(raw) as SignatureVaultState;

    // Guard against malformed data
    if (!parsed || typeof parsed !== "object") return { unlockedRole: null, expiresAtMs: null };

    // Expired session should not revive
    if (parsed.expiresAtMs && parsed.expiresAtMs <= nowMs()) {
      return { unlockedRole: null, expiresAtMs: null };
    }

    return {
      unlockedRole: parsed.unlockedRole ?? null,
      expiresAtMs: parsed.expiresAtMs ?? null,
    };
  } catch {
    return { unlockedRole: null, expiresAtMs: null };
  }
}

function saveSession(state: SignatureVaultState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // If storage fails, keep UX working in-memory.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const SignatureVaultContext = createContext<SignatureVaultContextValue | null>(null);

export function SignatureVaultProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadSession(), []);
  const [state, setState] = useState<SignatureVaultState>(initial);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState<SignatureRole | null>(null);

  const isUnlocked = useMemo(() => {
    if (!state.unlockedRole || !state.expiresAtMs) return false;
    return state.expiresAtMs > nowMs();
  }, [state.expiresAtMs, state.unlockedRole]);

  const openDialog = useCallback((role: SignatureRole) => {
    setRequestedRole(role);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    // Keep requestedRole until explicitly changed (helps quick retries),
    // but you can clear if you prefer stricter behavior.
  }, []);

  const lockNow = useCallback(() => {
    setState({ unlockedRole: null, expiresAtMs: null });
    clearSession();
    toast.message("Signature Vault locked");
  }, []);

  const unlockWithPin = useCallback(
    (pin: string) => {
      // 1) Basic validation
      if (!requestedRole) {
        toast.error("Select a signature role first (Master or CTO).");
        return false;
      }

      // 2) PIN check (Phase 2A mock)
      if (pin !== DEFAULT_MOCK_PIN) {
        toast.error("Incorrect PIN");
        return false;
      }

      // 3) Create a session
      const expiresAtMs = nowMs() + SESSION_DURATION_MIN * 60 * 1000;

      const next: SignatureVaultState = {
        unlockedRole: requestedRole,
        expiresAtMs,
      };

      setState(next);
      saveSession(next);

      toast.success(`${requestedRole} signature unlocked (${SESSION_DURATION_MIN} min)`);
      setIsDialogOpen(false);
      return true;
    },
    [requestedRole]
  );

  const getRemainingMinutes = useCallback(() => {
    if (!state.expiresAtMs || !isUnlocked) return null;
    const remainingMs = state.expiresAtMs - nowMs();
    const remainingMin = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
    return remainingMin;
  }, [isUnlocked, state.expiresAtMs]);

  const value: SignatureVaultContextValue = {
    isUnlocked,
    unlockedRole: isUnlocked ? state.unlockedRole : null,
    expiresAtMs: isUnlocked ? state.expiresAtMs : null,

    isDialogOpen,
    openDialog,
    closeDialog,

    unlockWithPin,
    lockNow,

    getRemainingMinutes,

    requestedRole,
  };

  return <SignatureVaultContext.Provider value={value}>{children}</SignatureVaultContext.Provider>;
}

export function useSignatureVault(): SignatureVaultContextValue {
  const ctx = useContext(SignatureVaultContext);
  if (!ctx) {
    // Developer-friendly error. In UI, this should never happen once wired.
    throw new Error("useSignatureVault must be used inside <SignatureVaultProvider />");
  }
  return ctx;
}
