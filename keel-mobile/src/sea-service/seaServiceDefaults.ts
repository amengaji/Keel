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
 * - Every section is initialized, even if not used
 * - This prevents undefined access errors
 * - Enables save & resume at any stage of the wizard
 *
 * NO UI CODE
 * NO DATABASE CODE
 * NO BUSINESS LOGIC
 */

/**
 * Top-level Sea Service payload structure.
 *
 * This object will eventually be:
 * - Serialized to JSON
 * - Stored in SQLite
 * - Synced to backend later
 */
export interface SeaServicePayload {
  /** Ship type selected by cadet */
  shipType: string | null;

  /** Timestamp of last update (epoch ms) */
  lastUpdatedAt: number | null;

  /** Section-wise data */
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
    INERT_GAS_SYSTEM: {},
  },
};

/**
 * ============================================================
 * NOTES
 * ============================================================
 *
 * - Even if a section is not enabled for a ship type,
 *   its data container still exists.
 *
 * - This design simplifies:
 *   - Conditional rendering
 *   - Partial saves
 *   - Backward compatibility
 *
 * - Field-level defaults will be applied later
 *   during UI rendering, not here.
 */
