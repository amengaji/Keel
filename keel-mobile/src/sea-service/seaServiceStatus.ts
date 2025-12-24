//keel-mobile/src/sea-service/seaServiceStatus.ts

/**
 * ============================================================
 * Sea Service — Status & Finalization Authority
 * ============================================================
 *
 * SINGLE SOURCE OF TRUTH FOR:
 * - Section status calculation
 * - Dashboard summaries
 * - Finalization eligibility
 *
 * CORE PRINCIPLES (LOCKED):
 * - Boolean fields are VALID when true OR false
 * - Optional fields MUST NOT block completion
 * - Conditional fields apply ONLY when their toggle is ON
 * - Option A finalization: ALL sections must be COMPLETED
 */

import {
  SEA_SERVICE_SECTIONS,
  SeaServiceSectionKey,
} from "../config/seaServiceSections";
import { SeaServicePayload } from "./seaServiceDefaults";

/**
 * ============================================================
 * SECTION STATUS TYPES
 * ============================================================
 */
export type SeaServiceSectionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

/**
 * ============================================================
 * GENERIC VALUE CHECK
 * ============================================================
 *
 * IMPORTANT RULE:
 * - Boolean FALSE is a VALID ANSWER
 * - Only null / undefined count as missing
 */
function hasValue(v: any): boolean {
  if (v === null || v === undefined) return false;

  // ✅ Explicit boolean answer is valid (true OR false)
  if (typeof v === "boolean") return true;

  if (typeof v === "number") return true;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;

  return false;
}

/**
 * ============================================================
 * DATE VALIDATION (ISO SAFE)
 * ============================================================
 */
function isValidDateValue(value: unknown): boolean {
  if (!value) return false;

  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }

  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  return false;
}

/**
 * ============================================================
 * SERVICE PERIOD COMPLETION
 * ============================================================
 *
 * RULE:
 * - Sign-on AND sign-off are mandatory
 */
export function isServicePeriodComplete(
  servicePeriod:
    | {
        signOnDate: string | Date | null;
        signOnPort: string | null;
        signOffDate: string | Date | null;
        signOffPort: string | null;
      }
    | undefined
): boolean {
  if (!servicePeriod) return false;

  return (
    isValidDateValue(servicePeriod.signOnDate) &&
    typeof servicePeriod.signOnPort === "string" &&
    servicePeriod.signOnPort.trim().length > 0 &&
    isValidDateValue(servicePeriod.signOffDate) &&
    typeof servicePeriod.signOffPort === "string" &&
    servicePeriod.signOffPort.trim().length > 0
  );
}

/**
 * ============================================================
 * SECTION STATUS ENGINE
 * ============================================================
 */
export function getSeaServiceSectionStatus(
  sectionKey: SeaServiceSectionKey,
  sectionData: any,
  shipType?: string
): SeaServiceSectionStatus {
  if (!sectionData || typeof sectionData !== "object") {
    return "NOT_STARTED";
  }

  const hasAnyData = Object.values(sectionData).some(hasValue);
  if (!hasAnyData) return "NOT_STARTED";

  switch (sectionKey) {
    case "LIFE_SAVING_APPLIANCES":
      return sectionData.lifeboatsAvailable ||
        sectionData.lifeRaftsAvailable ||
        sectionData.lifeJacketsAvailable
        ? "COMPLETED"
        : "IN_PROGRESS";

    case "FIRE_FIGHTING_APPLIANCES":
      return sectionData.engineRoomFixedAvailable ||
        sectionData.portableExtinguishersAvailable
        ? "COMPLETED"
        : "IN_PROGRESS";

    /**
     * ========================================================
     * INERT GAS SYSTEM (IGS) — FINAL LOGIC
     * ========================================================
     *
     * MANDATORY (must be answered true/false):
     * - igsSourceType
     * - scrubberAvailable
     * - blowerAvailable
     * - deckSealAvailable
     * - oxygenAnalyzerAvailable
     * - igPressureAlarmAvailable
     *
     * CONDITIONAL:
     * - blowerCount (only if blowerAvailable === true)
     * - deckSealType (only if deckSealAvailable === true)
     */
    case "INERT_GAS_SYSTEM": {

      const normalizedShipType = shipType
        ? shipType.toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_")
        : "";

      const isTanker =
        normalizedShipType === "TANKER" ||
        normalizedShipType === "OIL_TANKER" ||
        normalizedShipType === "PRODUCT_TANKER" ||
        normalizedShipType === "CHEMICAL_TANKER";

      // CASE 1 — IGS NOT FITTED (VALID FOR NON-TANKERS)
      if (
        sectionData.igsFitted === false &&
        !isTanker &&
        typeof sectionData.igsNotFittedReason === "string" &&
        sectionData.igsNotFittedReason.trim().length > 0
      ) {
        return "COMPLETED";
      }

      // CASE 2 — IGS FITTED
      if (sectionData.igsFitted === true) {
        const hasCore =
          hasValue(sectionData.igsSourceType) &&
          sectionData.scrubberAvailable !== undefined &&
          sectionData.blowerAvailable !== undefined &&
          sectionData.deckSealAvailable !== undefined &&
          sectionData.oxygenAnalyzerAvailable !== undefined &&
          sectionData.igPressureAlarmAvailable !== undefined;

        const requiresBlowerCount = sectionData.blowerAvailable === true;
        const requiresDeckSealType = sectionData.deckSealAvailable === true;

        const hasBlowerDetails =
          !requiresBlowerCount || hasValue(sectionData.blowerCount);

        const hasDeckSealDetails =
          !requiresDeckSealType || hasValue(sectionData.deckSealType);

        if (hasCore && hasBlowerDetails && hasDeckSealDetails) {
          return "COMPLETED";
        }

        return "IN_PROGRESS";
      }

      return "IN_PROGRESS";
    }

    /**
     * ========================================================
     * DEFAULT SECTION RULE
     * ========================================================
     *
     * RULE:
     * - Boolean-only sections are NEVER auto-completed
     * - Non-boolean fields must be filled
     */
    default: {
      const entries = Object.entries(sectionData);

      const nonBooleanEntries = entries.filter(
        ([, v]) => typeof v !== "boolean"
      );

      if (nonBooleanEntries.length === 0) {
        return "IN_PROGRESS";
      }

      const allNonBooleanFilled = nonBooleanEntries.every(([, v]) =>
        hasValue(v)
      );

      return allNonBooleanFilled ? "COMPLETED" : "IN_PROGRESS";
    }
  }
}

/**
 * ============================================================
 * DASHBOARD SUMMARY
 * ============================================================
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
 * ============================================================
 * FINALIZATION AUTHORITY (OPTION A)
 * ============================================================
 */
export function canFinalizeSeaService(
  payload: SeaServicePayload,
  shipType?: string
): boolean {
  if (!payload?.sections) return false;

  if (!isServicePeriodComplete(payload.servicePeriod)) {
    return false;
  }

  const summary = getSeaServiceSummary(payload.sections, shipType);
  return summary.completedSections === summary.totalSections;
}
