//keel-mobile/src/sea-service/seaServiceDefaults.ts

/**
 * ============================================================
 * Sea Service Default Payload
 * ============================================================
 *
 * This file defines the DEFAULT (empty) structure for
 * a Sea Service record.
 *
 * IMPORTANT:
 * - Every major data group is initialized
 * - Prevents undefined access errors
 * - Enables save & resume at any stage of the wizard
 *
 * NO UI CODE
 * NO DATABASE CODE
 * NO BUSINESS LOGIC
 */

/**
 * Top-level Sea Service payload structure.
 *
 * This object is:
 * - Serialized to JSON
 * - Stored in SQLite
 * - Synced to backend later
 */
export interface SeaServicePayload {
  /**
   * Ship type selected by cadet
   * (controls conditional sections later)
   */
  shipType: string | null;

  /**
   * Last local update timestamp (epoch ms)
   * Used for draft freshness + sync ordering
   */
  lastUpdatedAt: number | null;

  /**
   * ============================================================
   * SERVICE PERIOD (VESSEL CONTRACT)
   * ============================================================
   *
   * Applies to the entire Sea Service entry.
   * NOT a section — must be completed before finalize.
   *
   * Stored as ISO strings (YYYY-MM-DD) for inspector clarity.
   */
  servicePeriod: {
    signOnDate: string | null;
    signOnPort: string | null;
    signOffDate: string | null;
    signOffPort: string | null;
  };

  /**
   * ============================================================
   * SECTION-WISE DATA
   * ============================================================
   *
   * Each section owns its own internal keys.
   * Empty object = not started.
   */
  sections: {
    GENERAL_IDENTITY: Record<string, any>;
    DIMENSIONS_TONNAGE: Record<string, any>;
    PROPULSION_PERFORMANCE: Record<string, any>;
    AUX_MACHINERY_ELECTRICAL: Record<string, any>;
    DECK_MACHINERY_MANEUVERING: Record<string, any>;
    CARGO_CAPABILITIES: Record<string, any>;
    NAVIGATION_COMMUNICATION: Record<string, any>;
    LIFE_SAVING_APPLIANCES: Record<string, any>;
    FIRE_FIGHTING_APPLIANCES: Record<string, any>;
    POLLUTION_PREVENTION: Record<string, any>;
    INERT_GAS_SYSTEM: Record<string, any>;
  };
}

/**
 * ============================================================
 * DEFAULT EMPTY PAYLOAD
 * ============================================================
 *
 * Used when:
 * - Starting a new Sea Service entry
 * - Creating a draft
 * - Resetting corrupted data
 */
export const DEFAULT_SEA_SERVICE_PAYLOAD: SeaServicePayload = {
  shipType: null,
  lastUpdatedAt: null,

  servicePeriod: {
    signOnDate: null,
    signOnPort: null,
    signOffDate: null,
    signOffPort: null,
  },

  sections: {
    GENERAL_IDENTITY: {},
    DIMENSIONS_TONNAGE: {},
    PROPULSION_PERFORMANCE: {},
    AUX_MACHINERY_ELECTRICAL: {},
    DECK_MACHINERY_MANEUVERING: {},
    CARGO_CAPABILITIES: {},
    NAVIGATION_COMMUNICATION: {},
    LIFE_SAVING_APPLIANCES: {},
    FIRE_FIGHTING_APPLIANCES: {},
    POLLUTION_PREVENTION: {},
    INERT_GAS_SYSTEM: {},
  },
};

/**
 * ============================================================
 * NOTES
 * ============================================================
 *
 * - servicePeriod lives OUTSIDE sections intentionally
 * - Finalize will be gated on:
 *   • servicePeriod complete
 *   • all mandatory sections completed
 *
 * - No DB migration required (JSON payload only)
 * - Existing installs remain fully compatible
 */
