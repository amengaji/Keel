//keel-mobile/src/sea-service/SeaServiceContext.tsx

/**
 * ============================================================
 * Sea Service Context
 * ============================================================
 *
 * This context manages the in-memory state of the
 * Sea Service wizard.
 *
 * RESPONSIBILITIES:
 * - Hold the current Sea Service payload
 * - Allow partial updates section-by-section
 * - Support draft reset and initialization
 *
 * NOT RESPONSIBLE FOR:
 * - UI rendering
 * - Navigation
 * - SQLite persistence (added later)
 * - Sync logic
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  SeaServicePayload,
  DEFAULT_SEA_SERVICE_PAYLOAD,
} from "./seaServiceDefaults";

/**
 * Context shape exposed to consumers.
 */
interface SeaServiceContextType {
  /** Current working payload */
  payload: SeaServicePayload;

  /** Initialize a brand new Sea Service draft */
  startNewDraft: () => void;

  /** Update data for a specific section */
  updateSection: (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => void;

  /** Set ship type once selected */
  setShipType: (shipTypeCode: string) => void;

  /** Reset everything back to defaults */
  resetDraft: () => void;
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
  /**
   * Internal payload state.
   * Initialized with a deep copy of default payload.
   */
  const [payload, setPayload] = useState<SeaServicePayload>({
    ...DEFAULT_SEA_SERVICE_PAYLOAD,
    sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
  });

  /**
   * Start a fresh Sea Service draft.
   * Used when cadet creates a new entry.
   */
  const startNewDraft = () => {
    setPayload({
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      lastUpdatedAt: Date.now(),
    });
  };

  /**
   * Update data for a given section.
   * Existing section data is shallow-merged.
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
   * Set the ship type selected by cadet.
   * This will later control which sections appear.
   */
  const setShipType = (shipTypeCode: string) => {
    setPayload((prev) => ({
      ...prev,
      shipType: shipTypeCode,
      lastUpdatedAt: Date.now(),
    }));
  };

  /**
   * Reset the current draft completely.
   * Used on cancel / discard flows.
   */
  const resetDraft = () => {
    setPayload({
      ...DEFAULT_SEA_SERVICE_PAYLOAD,
      sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
    });
  };

  return (
    <SeaServiceContext.Provider
      value={{
        payload,
        startNewDraft,
        updateSection,
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
 *
 * Convenience hook to consume the Sea Service context.
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
