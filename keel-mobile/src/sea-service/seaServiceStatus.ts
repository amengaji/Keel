//keel-mobile/src/sea-service/seaServiceStatus.ts

/**
 * ============================================================
 * Sea Service — Section Status Utility
 * ============================================================
 *
 * PURPOSE:
 * - Single source of truth for Sea Service section status
 * - Used by:
 *   - SeaServiceWizard (navigation + completion logic)
 *   - Home Dashboard (read-only compliance snapshot)
 *
 * IMPORTANT:
 * - PURE LOGIC ONLY
 * - NO React
 * - NO UI
 * - NO side effects
 *
 * Status meanings (Inspector-grade):
 * - NOT_STARTED     → No interaction
 * - IN_PROGRESS     → Partial / draft data
 * - COMPLETED       → Compliance-critical data recorded
 */

import {
  SEA_SERVICE_SECTIONS,
  SeaServiceSectionKey,
} from "../config/seaServiceSections";

/**
 * Standardised section status values.
 * Kept string-based for easy display and comparison.
 */
export type SeaServiceSectionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

/**
 * ------------------------------------------------------------
 * Helper: check if a value is meaningfully filled
 * ------------------------------------------------------------
 */
function hasValue(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v === true;
  if (typeof v === "number") return true;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return false;
}

/**
 * ------------------------------------------------------------
 * Check if Service Period is fully completed
 * ------------------------------------------------------------
 */
export function isServicePeriodComplete(
  servicePeriod: {
    signOnDate: string | null;
    signOnPort: string | null;
    signOffDate: string | null;
    signOffPort: string | null;
  } | undefined
): boolean {
  if (!servicePeriod) return false;

  const { signOnDate, signOnPort, signOffDate, signOffPort } = servicePeriod;

  return (
    typeof signOnDate === "string" &&
    signOnDate.length > 0 &&
    typeof signOnPort === "string" &&
    signOnPort.trim().length > 0 &&
    typeof signOffDate === "string" &&
    signOffDate.length > 0 &&
    typeof signOffPort === "string" &&
    signOffPort.trim().length > 0
  );
}


/**
 * ------------------------------------------------------------
 * Get status for a SINGLE Sea Service section
 * ------------------------------------------------------------
 *
 * NOTE:
 * - This function intentionally stays conservative.
 * - It detects interaction vs emptiness reliably.
 * - Compliance rules can be tightened per section later.
 */
export function getSeaServiceSectionStatus(
  sectionKey: SeaServiceSectionKey,
  sectionData: any,
  shipType?: string
): SeaServiceSectionStatus {
  if (!sectionData || typeof sectionData !== "object") {
    return "NOT_STARTED";
  }

  // Detect ANY interaction
  const hasAnyData = Object.values(sectionData).some(hasValue);
  if (!hasAnyData) {
    return "NOT_STARTED";
  }

  /**
   * Section-specific compliance logic
   * ----------------------------------
   * We ONLY lock COMPLETED where rules are clear.
   * Everything else defaults safely to IN_PROGRESS.
   */

  switch (sectionKey) {
    case "LIFE_SAVING_APPLIANCES": {
      // If at least one major LSA category exists, we consider it completed.
      if (
        sectionData.lifeboatsAvailable ||
        sectionData.lifeRaftsAvailable ||
        sectionData.lifeJacketsAvailable
      ) {
        return "COMPLETED";
      }
      return "IN_PROGRESS";
    }

    case "FIRE_FIGHTING_APPLIANCES": {
      // Completion if core systems exist
      if (
        sectionData.engineRoomFixedAvailable ||
        sectionData.portableExtinguishersAvailable
      ) {
        return "COMPLETED";
      }
      return "IN_PROGRESS";
    }

    case "INERT_GAS_SYSTEM": {
      const isTanker =
        shipType === "TANKER" ||
        shipType === "OIL_TANKER" ||
        shipType === "PRODUCT_TANKER" ||
        shipType === "CHEMICAL_TANKER";

      // Not fitted but justified → completed for non-tankers
      if (
        !sectionData.igsFitted &&
        !isTanker &&
        typeof sectionData.igsNotFittedReason === "string" &&
        sectionData.igsNotFittedReason.trim().length > 0
      ) {
        return "COMPLETED";
      }

      // Fitted + core components → completed
      if (
        sectionData.igsFitted &&
        (sectionData.scrubberAvailable ||
          sectionData.blowerAvailable ||
          sectionData.deckSealAvailable)
      ) {
        return "COMPLETED";
      }

      return "IN_PROGRESS";
    }

    default:
      // For other sections, any interaction = IN_PROGRESS
      return "IN_PROGRESS";
  }
}

/**
 * ------------------------------------------------------------
 * Get OVERALL Sea Service summary
 * ------------------------------------------------------------
 *
 * Returns:
 * - totalSections
 * - completedSections
 * - inProgressSections
 * - notStartedSections
 */
export function getSeaServiceSummary(
  sectionsData: Record<string, any> | undefined,
  shipType?: string
) {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  SEA_SERVICE_SECTIONS.forEach((section) => {
    const data = sectionsData?.[section.key];
    const status = getSeaServiceSectionStatus(
      section.key,
      data,
      shipType
    );

    if (status === "COMPLETED") completed++;
    else if (status === "IN_PROGRESS") inProgress++;
    else notStarted++;
  });

  return {
    totalSections: SEA_SERVICE_SECTIONS.length,
    completedSections: completed,
    inProgressSections: inProgress,
    notStartedSections: notStarted,
  };
}
/**
 * ------------------------------------------------------------
 * Check if Sea Service can be FINALIZED
 * ------------------------------------------------------------
 *
 * Rules:
 * - Service Period must be complete
 * - ALL sections must be COMPLETED
 */
export function canFinalizeSeaService(
  payload: {
    servicePeriod?: any;
    sections?: Record<string, any>;
  },
  shipType?: string
): boolean {
  if (!payload?.sections) return false;

  // 1️⃣ Service Period check
  if (!isServicePeriodComplete(payload.servicePeriod)) {
    return false;
  }

  // 2️⃣ Section completion check
  const summary = getSeaServiceSummary(payload.sections, shipType);

  return summary.completedSections === summary.totalSections;
}

