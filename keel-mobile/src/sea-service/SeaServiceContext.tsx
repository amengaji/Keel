//keel-mobile/src/sea-service/SeaServiceContext.tsx

/**
 * ============================================================
 * Sea Service Context (SQLite-Backed, Draft-Safe)
 * ============================================================
 *
 * RESPONSIBILITIES (UPDATED):
 * - Hold in-memory Sea Service payload
 * - Load draft from SQLite on mount
 * - Auto-save draft:
 *    • On every section update
 *    • On wizard unmount / exit
 *
 * STILL NOT RESPONSIBLE FOR:
 * - UI rendering
 * - Navigation
 * - Sync to backend (future step)
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
import {
  getSeaServicePayloadOrDefault,
  upsertSeaServiceDraft,
} from "../db/seaService";
import { useToast } from "../components/toast/useToast";

/**
 * Context shape exposed to consumers.
 */
interface SeaServiceContextType {
  payload: SeaServicePayload;
  startNewDraft: () => void;
  updateSection: (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => void;
  setShipType: (shipTypeCode: string) => void;
  resetDraft: () => void;
    updateServicePeriod: (
    period: SeaServicePayload["servicePeriod"]
  ) => void;

}

/**
 * Internal React context.
 */
const SeaServiceContext = createContext<SeaServiceContextType | undefined>(
  undefined
);

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */
export function SeaServiceProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  /**
   * In-memory payload state.
   * Initialized empty, then hydrated from SQLite.
   */
  const [payload, setPayload] = useState<SeaServicePayload>(() => ({
    ...DEFAULT_SEA_SERVICE_PAYLOAD,
    sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
  }));

  /**
   * Track whether initial DB load is complete.
   * Prevents accidental overwrite on first render.
   */
  const hasHydratedRef = useRef(false);

  /**
   * ============================================================
   * INITIAL LOAD — SQLite → Context
   * ============================================================
   */
  useEffect(() => {
    try {
      const storedPayload = getSeaServicePayloadOrDefault();

      setPayload({
        ...storedPayload,
        sections: { ...storedPayload.sections },
      });

      hasHydratedRef.current = true;
    } catch (err) {
      console.error("Failed to load Sea Service draft:", err);
      toast.error("Failed to load Sea Service draft. Using empty form.");
      hasHydratedRef.current = true;
    }
  }, [toast]);

  /**
   * ============================================================
   * AUTO-SAVE — Context → SQLite
   * ============================================================
   *
   * Triggered on ANY payload change AFTER hydration.
   */
  useEffect(() => {
    if (!hasHydratedRef.current) return;

    try {
      upsertSeaServiceDraft(payload);
      // Silent success (no toast spam)
    } catch (err) {
      console.error("Auto-save Sea Service failed:", err);
      toast.error("Auto-save failed. Your draft may not be saved.");
    }
  }, [payload, toast]);

  /**
   * ============================================================
   * PUBLIC ACTIONS
   * ============================================================
   */

  /**
   * Start a brand-new draft.
   * Overwrites current in-memory state and DB record.
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
   * Update data for a given section.
   * Shallow-merge only the affected section.
   */
  const updateSection = (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => {
    setPayload((prev) => ({
      ...prev,
      lastUpdatedAt: Date.now(),
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
 * Update service period (sign on / off details)
 * Stored at top-level, not inside sections
 */
const updateServicePeriod = (
  period: SeaServicePayload["servicePeriod"]
) => {
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
   * Reset draft completely (memory + DB).
   */
  const resetDraft = () => {
    const resetPayload: SeaServicePayload = {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
    };

    setPayload(resetPayload);
  };

  return (
    <SeaServiceContext.Provider
      value={{
        payload,
        startNewDraft,
        updateSection,
        updateServicePeriod,
        setShipType,
        resetDraft,
      }}
    >
      {children}
    </SeaServiceContext.Provider>
  );
}

/**
 * ============================================================
 * HOOK
 * ============================================================
 */
export function useSeaService() {
  const ctx = useContext(SeaServiceContext);
  if (!ctx) {
    throw new Error(
      "useSeaService must be used within a SeaServiceProvider"
    );
  }
  return ctx;
}
