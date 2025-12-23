//keel-mobile/src/sea-service/seaServiceStatus.ts

/**
 * ============================================================
 * Sea Service — Status & Finalization Authority
 * ============================================================
 *
 * THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR:
 * - Section status calculation
 * - Dashboard summaries
 * - Finalization eligibility (SIGN-OFF REQUIRED)
 *
 * IMPORTANT:
 * - Existing exports are preserved for backward compatibility
 * - Finalization rules are now CENTRALIZED and AUDIT-SAFE
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
 * INTERNAL HELPERS
 * ============================================================
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
 * SERVICE PERIOD COMPLETION (UPDATED)
 * ============================================================
 *
 * SIGN-OFF IS NOW REQUIRED (APPROVED RULE)
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
 * SECTION STATUS (UNCHANGED LOGIC)
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

case "INERT_GAS_SYSTEM": {
  /**
   * ============================================================
   * NORMALIZE SHIP TYPE (DISPLAY VALUE → ENUM)
   * ============================================================
   */
  const normalizedShipType = shipType
    ? shipType
        .toUpperCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_")
    : "";

  const isTanker =
    normalizedShipType === "TANKER" ||
    normalizedShipType === "OIL_TANKER" ||
    normalizedShipType === "PRODUCT_TANKER" ||
    normalizedShipType === "CHEMICAL_TANKER";


  /**
   * ============================================================
   * CASE 1 — IGS NOT FITTED (VALID FOR NON-TANKERS)
   * ============================================================
   */
  if (
    sectionData.igsFitted === false &&
    !isTanker &&
    typeof sectionData.igsNotFittedReason === "string" &&
    sectionData.igsNotFittedReason.trim().length > 0
  ) {
    return "COMPLETED";
  }

  /**
   * ============================================================
   * CASE 2 — IGS FITTED (MANDATORY ITEMS ONLY)
   * ============================================================
   */
  if (sectionData.igsFitted === true) {
const scrubberAvailable = sectionData.scrubberAvailable === true;
const blowerAvailable = sectionData.blowerAvailable === true;
const deckSealAvailable = sectionData.deckSealAvailable === true;

    const hasMandatoryCore =
      hasValue(sectionData.igsSourceType) &&
      sectionData.scrubberAvailable !== undefined &&
      sectionData.blowerAvailable !== undefined &&
      sectionData.deckSealAvailable !== undefined &&
      hasValue(sectionData.oxygenAnalyzerAvailable) &&
      hasValue(sectionData.igPressureAlarmAvailable);


    const hasBlowerDetails =
      !blowerAvailable || hasValue(sectionData.blowerCount);

    const hasDeckSealDetails =
      !deckSealAvailable || hasValue(sectionData.deckSealType);


        if (hasMandatoryCore && hasBlowerDetails && hasDeckSealDetails) {
          return "COMPLETED";
        }
      }

  return "IN_PROGRESS";
}


    default:
      return "IN_PROGRESS";
  }
}

/**
 * ============================================================
 * DASHBOARD SUMMARY (BACKWARD COMPATIBLE)
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
 * FINALIZATION AUTHORITY (SINGLE SOURCE OF TRUTH)
 * ============================================================
 *
 * SIGN-OFF REQUIRED
 * OPTION A: ALL SECTIONS MUST BE COMPLETED
 */
export function canFinalizeSeaService(
  payload: SeaServicePayload,
  shipType?: string
): boolean {
  if (!payload?.sections) return false;

  // 1️⃣ Service Period must be complete
  if (!isServicePeriodComplete(payload.servicePeriod)) {
    return false;
  }

  // 2️⃣ ALL sections must be COMPLETED (Option A)
  const summary = getSeaServiceSummary(payload.sections, shipType);

  return summary.completedSections === summary.totalSections;
}
