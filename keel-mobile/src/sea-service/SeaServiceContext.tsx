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
  SeaServiceSectionStatusMap
} from "./seaServiceDefaults";
import {
  getSeaServicePayloadOrDefault,
  upsertSeaServiceDraft,
  getSeaServiceRecord,
} from "../db/seaService";
import { useToast } from "../components/toast/useToast";



/**
 * Context shape exposed to consumers.
 */
interface SeaServiceContextType {
  payload: SeaServicePayload;
    // Active Sea Service DB record id (null if no active draft exists)
  seaServiceId: string | null;


  canFinalize: boolean;

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

  // Holds the DB record ID for the active Sea Service
  const [seaServiceId, setSeaServiceId] = useState<string | null>(null);


  /**
   * Track whether initial DB load is complete.
   * Prevents accidental overwrite on first render.
   */
  const hasHydratedRef = useRef(false);

  /**
   * Track if current Sea Service is FINAL.
   * FINAL records must be READ-ONLY.
   */
  const isFinalizedRef = useRef<boolean>(false);


  /**
   * ============================================================
   * INITIAL LOAD — SQLite → Context
   * ============================================================
   */
  useEffect(() => {
    try {
      const record = getSeaServiceRecord();

      if (record) {
        isFinalizedRef.current = record.status === "FINAL";

          // Store DB record ID separately from payload
        setSeaServiceId(record.id);

        setPayload({
          ...record.payload,
          sections: { ...record.payload.sections },
        });
      } else {
        isFinalizedRef.current = false;

        setSeaServiceId(null);


        setPayload({
          ...DEFAULT_SEA_SERVICE_PAYLOAD,
          sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
        });
      }

      hasHydratedRef.current = true;
    } catch (err) {
      console.error("Failed to hydrate Sea Service:", err);
      toast.error("Failed to load Sea Service draft.");
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
      if (!seaServiceId) return;
      upsertSeaServiceDraft(seaServiceId, payload);
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
    if (isFinalizedRef.current) return;
    const freshPayload: SeaServicePayload = {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      lastUpdatedAt: Date.now(),
    };

    setPayload(freshPayload);
  };

    /**
     * Update data for a given section.
     * - Merges section data
     * - Marks section as COMPLETE
     * - Keeps draft-safe behavior
     */
const updateSection = (
  sectionKey: keyof SeaServicePayload["sections"],
  data: Record<string, any>
) => {
  if (isFinalizedRef.current) return;
  setPayload((prev) => ({
    ...prev,
    lastUpdatedAt: Date.now(),

    // Mark this section as completed
    sectionStatus: {
      ...prev.sectionStatus,
      [sectionKey]: "COMPLETE",
    },

    // Update section data
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
  if (isFinalizedRef.current) return;
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
    if (isFinalizedRef.current) return;
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
    if (isFinalizedRef.current) return;
    const resetPayload: SeaServicePayload = {
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
    };

    setPayload(resetPayload);
  };

  /**
 * ============================================================
 * FINALIZATION ELIGIBILITY (DERIVED STATE)
 * ============================================================
 *
 * Rules:
 * - Must have sign-on date
 * - Sign-off date NOT required
 * - All mandatory sections must be COMPLETE
 */
const canFinalize = (() => {
  const period = payload.servicePeriod;

  // Sign-on is mandatory
  if (!period || !period.signOnDate) return false;

  const statuses = payload.sectionStatus;

  // Safety: sectionStatus must exist
  if (!statuses) return false;

  // Typed section keys (NO string indexing)
  const sectionKeys = Object.keys(payload.sections) as Array<
    keyof typeof payload.sections
  >;

  return sectionKeys.every(
    (key) => statuses[key] === "COMPLETE"
  );
})();





  return (
    <SeaServiceContext.Provider
      value={{
        payload,
        seaServiceId,
        canFinalize,
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
