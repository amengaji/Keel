//keel-mobile/src/sea-service/SeaServiceContext.tsx

/**
 * ============================================================
 * Sea Service Context (SQLite-Backed, Draft-Safe)
 * ============================================================
 *
 * RESPONSIBILITIES:
 * - Hold ACTIVE Sea Service draft payload in memory (DRAFT only)
 * - Load ACTIVE draft from SQLite on mount
 * - Load FINAL Sea Service history list from SQLite on mount
 * - Auto-save DRAFT on payload changes (draft-safe)
 * - Central authority for finalization (DRAFT → FINAL)
 *
 * NOT RESPONSIBLE FOR:
 * - UI rendering
 * - Navigation
 * - Backend sync (future)
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";

import {
  SeaServicePayload,
  DEFAULT_SEA_SERVICE_PAYLOAD,
} from "./seaServiceDefaults";

import type { SeaServiceRecord } from "../db/seaService";

import {
  getActiveSeaServiceDraft,
  getSeaServiceFinalHistory,
  upsertSeaServiceDraft,
  finalizeSeaService,
  discardSeaServiceDraft,
} from "../db/seaService";

import { useToast } from "../components/toast/useToast";
import { canFinalizeSeaService } from "./seaServiceStatus";

/**
 * Context shape exposed to consumers.
 */
interface SeaServiceContextType {
  
  /**
   * ACTIVE draft payload only (if seaServiceId exists).
   * When there is no active draft, payload is the default empty payload.
   */
  payload: SeaServicePayload;

  /**
   * Active Sea Service DB record id (null if no active draft exists).
   */
  seaServiceId: string | null;

  /**
   * FINAL history list (read-only).
   * Multiple records, sorted latest-first.
   */
  finalHistory: SeaServiceRecord[];

  /**
   * Finalization eligibility (central authority).
   */
  canFinalize: boolean;

  /**
   * Actions
   */
  startNewDraft: () => void;
  updateSection: (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => void;
  updateServicePeriod: (period: SeaServicePayload["servicePeriod"]) => void;
  setShipType: (shipTypeCode: string) => void;
  resetDraft: () => void;

  /**
   * Central finalize action (DRAFT → FINAL).
   * UI must call via confirmation dialog.
   */
  finalizeSeaService: () => Promise<void>;

    /**
   * Discard ACTIVE draft (DRAFT only).
   * Must never delete FINAL records.
   */
  discardDraft: () => Promise<void>;


  /**
   * Refresh FINAL history list from DB (useful after finalize).
   */
  refreshFinalHistory: () => void;
}

/**
 * Internal React context.
 */
const SeaServiceContext = createContext<SeaServiceContextType | undefined>(
  undefined
);

export function SeaServiceProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  /**
   * In-memory payload state.
   * This represents ONLY the ACTIVE draft payload.
   */
  const [payload, setPayload] = useState<SeaServicePayload>(() => ({
    ...DEFAULT_SEA_SERVICE_PAYLOAD,
    sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
  }));

  /**
   * DB record id for the active DRAFT (null if none).
   */
  const [seaServiceId, setSeaServiceId] = useState<string | null>(null);

  /**
   * FINAL records history list.
   */
  const [finalHistory, setFinalHistory] = useState<SeaServiceRecord[]>([]);

  /**
   * Track whether initial DB hydration is done.
   * Prevents accidental overwrite during first render.
   */
  const hasHydratedRef = useRef(false);

  /**
   * ============================================================
   * Helper: refresh FINAL history (read-only)
   * ============================================================
   */
  const refreshFinalHistory = () => {
    try {
      const finals = getSeaServiceFinalHistory();
      setFinalHistory(finals);
    } catch (err) {
      console.error("Failed to load Sea Service history:", err);
      toast.error("Failed to load Sea Service history.");
    }
  };

  /**
   * ============================================================
   * INITIAL LOAD — SQLite → Context
   * ============================================================
   *
   * IMPORTANT:
   * - Context holds ACTIVE draft only.
   * - FINAL records are shown via finalHistory[].
   */
  useEffect(() => {
    try {
      // 1) Load FINAL history (always)
      refreshFinalHistory();

      // 2) Load ACTIVE draft (if any)
      const draft = getActiveSeaServiceDraft();

      if (draft) {
        setSeaServiceId(draft.id);

        setPayload({
          ...draft.payload,
          sections: { ...draft.payload.sections },
        });
      } else {
        setSeaServiceId(null);

        setPayload({
          ...DEFAULT_SEA_SERVICE_PAYLOAD,
          sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
        });
      }

      hasHydratedRef.current = true;
    } catch (err) {
      console.error("Failed to hydrate Sea Service:", err);
      toast.error("Failed to load Sea Service.");
      hasHydratedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ============================================================
   * AUTO-SAVE — Context → SQLite (DRAFT only)
   * ============================================================
   *
   * Triggered on ANY payload change AFTER hydration.
   * Only saves when seaServiceId exists (active DRAFT exists).
   */
  useEffect(() => {
    if (!hasHydratedRef.current) return;

    try {
      if (!seaServiceId) return;
      upsertSeaServiceDraft(seaServiceId, payload);
      // silent success (no toast spam)
    } catch (err) {
      console.error("Auto-save Sea Service failed:", err);
      toast.error("Auto-save failed. Your draft may not be saved.");
    }
  }, [payload, seaServiceId, toast]);

  /**
   * ============================================================
   * PUBLIC ACTIONS
   * ============================================================
   */

  /**
   * Start a brand-new draft (memory only).
   * NOTE:
   * - Creating the DB row (id) is handled by your existing flow when a draft is persisted.
   * - We keep this lightweight and draft-safe.
   */
  const startNewDraft = () => {
    const freshPayload: SeaServicePayload = {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      lastUpdatedAt: Date.now(),
    };

    setPayload(freshPayload);
  };

  /**
   * Update data for a given section:
   * - merges section data
   * - marks section as COMPLETE
   */
  const updateSection = (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => {
    setPayload((prev) => ({
      ...prev,
      lastUpdatedAt: Date.now(),
      sectionStatus: {
        ...prev.sectionStatus,
        [sectionKey]: "COMPLETE",
      },
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          ...data,
        },
      },
    }));
  };

  /**
   * Update service period (sign on/off).
   * Stored at top-level.
   */
  const updateServicePeriod = (period: SeaServicePayload["servicePeriod"]) => {
    setPayload((prev) => ({
      ...prev,
      lastUpdatedAt: Date.now(),
      servicePeriod: {
        ...prev.servicePeriod,
        ...period,
      },
    }));
  };

  /**
   * Set ship type selected by cadet.
   */
  const setShipType = (shipTypeCode: string) => {
    setPayload((prev) => ({
      ...prev,
      shipType: shipTypeCode,
      lastUpdatedAt: Date.now(),
    }));
  };

  /**
   * Reset draft completely (memory only).
   * DB removal (discard) is a separate step (approved for DRAFT only).
   */
  const resetDraft = () => {
    setPayload({
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
    });
  };

  /**
   * ============================================================
   * FINALIZATION ELIGIBILITY (CENTRAL AUTHORITY)
   * ============================================================
   */
  const canFinalize = canFinalizeSeaService(payload);

  /**
   * ============================================================
   * FINALIZE SEA SERVICE (CENTRAL AUTHORITY)
   * ============================================================
   *
   * - Validates eligibility (canFinalize)
   * - Updates DB status DRAFT → FINAL
   * - Clears active draft id + resets payload
   * - Refreshes FINAL history list
   */
  const finalizeSeaServiceAction = async () => {
    try {
      if (!seaServiceId) {
        toast.error("No active Sea Service to finalize.");
        return;
      }

      if (!canFinalize) {
        toast.error(
          "Sea Service is not eligible for finalization. Please complete all requirements."
        );
        return;
      }

      // DB: DRAFT → FINAL (authoritative lifecycle transition)
      finalizeSeaService(seaServiceId);

      // Clear active draft in memory
      setSeaServiceId(null);
      setPayload({
        ...DEFAULT_SEA_SERVICE_PAYLOAD,
        sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      });

      // Refresh history list
      refreshFinalHistory();

      toast.success("Sea Service finalized successfully.");
    } catch (err) {
      console.error("Failed to finalize Sea Service:", err);
      toast.error("Failed to finalize Sea Service. Please try again.");
    }

    
  };
  /**
   * ============================================================
   * DISCARD DRAFT (DRAFT ONLY — CENTRAL AUTHORITY)
   * ============================================================
   *
   * - Deletes the ACTIVE DRAFT from DB
   * - Clears active draft id + resets payload
   * - FINAL records remain untouched (immutable)
   */
  const discardDraftAction = async () => {
    try {
      if (!seaServiceId) {
        toast.error("No active draft to discard.");
        return;
      }

      // DB: delete only if status is DRAFT (guard is inside DB function)
      discardSeaServiceDraft(seaServiceId);

      // Clear active draft in memory
      setSeaServiceId(null);
      setPayload({
        ...DEFAULT_SEA_SERVICE_PAYLOAD,
        sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      });

      toast.success("Draft discarded successfully.");
    } catch (err) {
      console.error("Failed to discard Sea Service draft:", err);
      toast.error("Failed to discard draft. Please try again.");
    }
  };

  

  return (
    <SeaServiceContext.Provider
      value={{
        payload,
        seaServiceId,
        finalHistory,
        canFinalize,
        startNewDraft,
        updateSection,
        updateServicePeriod,
        setShipType,
        resetDraft,
        finalizeSeaService: finalizeSeaServiceAction,
        discardDraft: discardDraftAction,
        refreshFinalHistory,
      }}
    >
      {children}
    </SeaServiceContext.Provider>
  );
}

/**
 * Hook
 */
export function useSeaService() {
  const ctx = useContext(SeaServiceContext);
  if (!ctx) {
    throw new Error("useSeaService must be used within a SeaServiceProvider");
  }
  return ctx;
}
