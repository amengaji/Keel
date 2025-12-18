//keel-mobile/src/screens/DailyScreen.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable
} from "react-native";
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  Divider,
  IconButton,
  Checkbox,
  RadioButton,
  useTheme,
  SegmentedButtons,
} from "react-native-paper";
import Toast from "react-native-toast-message";

import DateInputField from "../components/inputs/DateInputField";
import TimeInputField from "../components/inputs/TimeInputField";
import LatLongInput from "../components/inputs/LatLongInput";
import {
  insertDailyLog,
  updateDailyLog,
  deleteDailyLogById,
} from "../db/dailyLogs";
import { useDailyLogs } from "../daily-logs/DailyLogsContext";
import { calculateDailyWatchTotals } from "../utils/watchAggregation";
import { calculateWeeklyWatchTotals } from "../utils/watchWeeklyAggregation";
import { checkStcwCompliance } from "../utils/stcwCompliance";

/* ============================================================
   TYPES
   ============================================================ */

/**
 * ============================================================
 * Daily Screen — Top-level UX Intent Tabs
 * ============================================================
 *
 * DAILY_WORK  → time-based daily duties (counts toward STCW)
 * SEA_WATCH   → bridge / engine watchkeeping
 * PORT_WATCH  → cargo / anchor / security / bunkering (coming next)
 * STATUS      → compliance / summaries (unchanged)
 * HISTORY     → past entries (unchanged)
 */
type DailyTab =
  | "DAILY_WORK"
  | "SEA_WATCH"
  | "PORT_WATCH"
  | "STATUS"
  | "HISTORY";

type PortWatchType =
  | "CARGO"
  | "ANCHOR"
  | "SECURITY"
  | "BUNKERING";


  /**
 * ============================================================
 * LogType — underlying duty record type
 * ============================================================
 *
 * NOTE:
 * - This already existed earlier in the file.
 * - It MUST remain declared for form logic & DB writes.
 * - UI tabs map onto these values.
 */
type LogType = "DAILY" | "BRIDGE" | "ENGINE" | "PORT";


type DailyLogEntry = {
  id: string;
  date: Date;
  type: LogType;

    /**
   * Port Watch subtype (only meaningful when type === "PORT")
   * Stored in DB column: portWatchType
   */
  portWatchType?: PortWatchType | null;
  
  startTime?: Date;
  endTime?: Date;
  summary: string;
  remarks?: string;

  latDeg?: number | null;
  latMin?: number | null;
  latDir?: "N" | "S" | null;
  lonDeg?: number | null;
  lonMin?: number | null;
  lonDir?: "E" | "W" | null;

  courseDeg?: number | null;
  speedKn?: number | null;
  weather?: string | null;
  steeringMinutes?: number | null;
  isLookout?: boolean;

    /**
   * ENGINE WATCH PAYLOAD (JSON)
   * Stored in SQLite column: machinery_monitored
   * We keep it as a string here and parse it only when needed (edit mode).
   */
  machineryMonitored?: string | null;
};

const LOG_TYPE_LABEL: Record<LogType, string> = {
  DAILY: "Daily",
  BRIDGE: "Bridge Watch",
  ENGINE: "Engine Watch",
  PORT: "Port Watch",
};

const OCEAN_GREEN = "#3194A0";
/* ============================================================
   DEV OVERRIDE — CADET STREAM (TEMPORARY)
   ============================================================
   ⚠️ REMOVE WHEN PROFILE WIRING IS COMPLETE
   ------------------------------------------------------------
   Used ONLY for testing Engine Watch STCW logic.
   Source of truth will later be:
   user.profile.cadetStream (assigned by Shore Admin)
   ============================================================ */

const DEV_CADET_STREAM: "DECK" | "ENGINE" = "ENGINE";
// Change to "ENGINE" to test Engine Cadet logic


/* ============================================================
   SCREEN
   ============================================================ */
export default function DailyScreen() {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);

  const {
  logs,
  refreshLogs,
  loading: dailyLogsLoading,
} = useDailyLogs();


    /* ---------------- DATA ---------------- */

  const [entries, setEntries] = useState<DailyLogEntry[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

    /* =======================
     TAB STATE (PHASE D7)
     Controls which major mode the screen is in.
     ======================= */


  /* =======================
     TAB STATE (Phase D2.1)
     Controls which major mode the screen is in.
     NOTE:
     - DailyTab type is declared ONCE at the top of the file.
     - Do NOT redeclare it inside the component (TypeScript will get messy).
     ======================= */
  const [activeTab, setActiveTab] = useState<DailyTab>("DAILY_WORK");
  /**
   * ============================================================
   * Primary Screen Mode
   * ============================================================
   * LOG     → Create log entries
   * REVIEW  → Review status & history
   */
  type PrimaryMode = "LOG" | "REVIEW";

  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>("LOG");





  /* =======================
     HELPERS
     ======================= */

/**
 * buildEngineSummaryText
 * ----------------------
 * Converts machineryMonitored JSON into a human-readable summary.
 * Used ONLY in History cards (read-only).
 */
const buildEngineSummaryText = (payloadJson?: string | null): string | null => {
  if (!payloadJson) return null;

  try {
    const p = JSON.parse(payloadJson);

    const parts: string[] = [];

    if (p.engineWatchType) parts.push(p.engineWatchType);
    if (p.engineRunning) parts.push("Engine Running");
    if (p.manoeuvring) parts.push("Manoeuvring");

    if (p.generatorsRunning) {
      const gens = Object.entries(p.generatorsRunning)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      if (gens.length) parts.push(`DG: ${gens.join(", ")}`);
    }

    if (p.engineLoadPercent != null) {
      parts.push(`Load ${p.engineLoadPercent}%`);
    }

    if (p.fuelType) parts.push(`Fuel ${p.fuelType}`);

    return parts.join(" • ");
  } catch {
    return null;
  }
};

  /**
   * Converts minutes into a friendly "Xh Ym" string.
   * Example: 485 -> "8h 5m"
   */
  const formatMinutesToHoursMinutes = (minutes: number) => {
    const safe = Math.max(0, Math.floor(minutes || 0));
    const hrs = Math.floor(safe / 60);
    const mins = safe % 60;
    return `${hrs}h ${mins}m`;
  };

  const calculateDurationMinutes = (start?: Date, end?: Date): number | null => {
  if (!start || !end) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;

  return Math.floor(diffMs / 60000);
};

const rangesOverlap = (
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean => {
  return aStart < bEnd && bStart < aEnd;
};

const findOverlappingEntry = (
  entries: DailyLogEntry[],
  newEntry: {
    id?: string;
    date: Date;
    startTime?: Date | null;
    endTime?: Date | null;
  }
): DailyLogEntry | null => {
  return (
    entries.find((e) => {
      // Skip self when editing
      if (newEntry.id && e.id === newEntry.id) return false;

      // Different day → ignore
      if (e.date.toDateString() !== newEntry.date.toDateString()) return false;

      // DAILY vs TIMED
      if (!newEntry.startTime || !newEntry.endTime) {
        return !!(e.startTime && e.endTime);
      }

      if (!e.startTime || !e.endTime) {
        return true;
      }

      return rangesOverlap(
        newEntry.startTime,
        newEntry.endTime,
        e.startTime,
        e.endTime
      );
    }) ?? null
  );
};

  /* =======================
     FORM STATE
     ======================= */

  const [logType, setLogType] = useState<LogType>("DAILY");

  /**
   * ============================================================
   * Duty Mode (UI intent only)
   * ============================================================
   * DAILY_WORK → general daywork (counts toward STCW)
   * SEA_WATCH  → bridge / engine watchkeeping
   * PORT_WATCH → cargo / anchor / security / bunkering (next step)
   */
  type DutyMode = "DAILY_WORK" | "SEA_WATCH" | "PORT_WATCH";

  const [dutyMode, setDutyMode] = useState<DutyMode>("DAILY_WORK");
  /**
 * ============================================================
 * Sea Watch Sub-Mode (Bridge vs Engine)
 * ============================================================
 * Only relevant when dutyMode === "SEA_WATCH"
 */
type SeaWatchMode = "BRIDGE" | "ENGINE";

const [seaWatchMode, setSeaWatchMode] =
  useState<SeaWatchMode>("BRIDGE");


const [portWatchType, setPortWatchType] =
  useState<PortWatchType>("CARGO");



/**
 * ============================================================
 * Map Duty Mode + Sea Watch Mode → underlying LogType
 * ============================================================
 * Keeps all existing save & STCW logic intact.
 */
useEffect(() => {
  if (dutyMode === "DAILY_WORK") {
    setLogType("DAILY");
  }

  if (dutyMode === "SEA_WATCH") {
    setLogType(seaWatchMode);
  }
  
  // IMPORTANT: Port Watch must be a real LogType so it counts toward STCW work hours
  if (dutyMode === "PORT_WATCH") {
    setLogType("PORT");
  }

  // PORT_WATCH intentionally not mapped yet
}, [dutyMode, seaWatchMode]);



  const [date, setDate] = useState<Date | null>(today);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Bridge / Watch period (supports midnight crossover)
  const [watchStartDate, setWatchStartDate] = useState<Date | null>(new Date());
  const [watchEndDate, setWatchEndDate] = useState<Date | null>(new Date());

  const [summary, setSummary] = useState("");
  const [remarks, setRemarks] = useState("");

    /* ============================================================
     DAILY WORK (D2) — CATEGORY STATE
     ============================================================
     - Multi-select categories
     - At least one required
     - Drives conditional UI below
     ============================================================ */

  type DailyWorkCategory =
    | "MAINTENANCE"
    | "DRILL"
    | "TRAINING"
    | "ADMIN"
    | "OTHER";

  const DAILY_WORK_CATEGORIES: {
    key: DailyWorkCategory;
    label: string;
    requiresSummary: boolean;
  }[] = [
    { key: "MAINTENANCE", label: "Maintenance", requiresSummary: true },
    { key: "DRILL", label: "Drill", requiresSummary: true },
    { key: "TRAINING", label: "Training", requiresSummary: true },
    { key: "ADMIN", label: "Admin / Paperwork", requiresSummary: false },
    { key: "OTHER", label: "Other", requiresSummary: true },
  ];

  const [dailyWorkCategories, setDailyWorkCategories] = useState<
    DailyWorkCategory[]
  >([]);

  const toggleDailyWorkCategory = (cat: DailyWorkCategory) => {
    setDailyWorkCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const dailyWorkSummaryRequired = DAILY_WORK_CATEGORIES.some(
    (c) =>
      dailyWorkCategories.includes(c.key) && c.requiresSummary
  );


  const [latDeg, setLatDeg] = useState<number | null>(null);
  const [latMin, setLatMin] = useState<number | null>(null);
  const [latDir, setLatDir] = useState<"N" | "S">("N");
  const [isLatValid, setIsLatValid] = useState(false);

  const [lonDeg, setLonDeg] = useState<number | null>(null);
  const [lonMin, setLonMin] = useState<number | null>(null);
  const [lonDir, setLonDir] = useState<"E" | "W">("E");
  const [isLonValid, setIsLonValid] = useState(false);

  const [courseDeg, setCourseDeg] = useState<string>("");
  const [isCourseValid, setIsCourseValid] = useState(true);

  const [speedKn, setSpeedKn] = useState<string>("");
  const [steeringMinutes, setSteeringMinutes] = useState<number | null>(null);
  const [weather, setWeather] = useState("");
  const [isLookout, setIsLookout] = useState<boolean>(false);


    /* ============================================================
     ENGINE WATCH STATE (PHASE D7.3.4)
     These states are UI-only for now.
     No DB persistence in this phase.
     ============================================================ */

  // --- Engine Watch Overview ---

  /**
   * ============================================================
   * ENGINE WATCH TYPE (UMS / MANNED / STANDBY)
   * ============================================================
   * Used for Engine Cadet qualification (Option B).
   * ============================================================
   */
  const [engineWatchType, setEngineWatchType] = useState<
    "UMS" | "MANNED" | "STANDBY" | null
  >(null);

  const [engineRunning, setEngineRunning] = useState<boolean>(false);

  /**
   * Manoeuvring = critical operations (arrival/departure, pilotage support,
   * heavy traffic, engine readiness) where standby/UMS becomes watch-relevant.
   */
  const [manoeuvring, setManoeuvring] = useState<boolean>(false);

  const [engineRoomAttendance, setEngineRoomAttendance] = useState<
    "SOLO" | "WITH_SENIOR" | "TEAM" | null
  >(null);

  /**
   * ============================================================
   * WATCHKEEPING QUALIFICATION (OPTION B — LOCKED)
   * ============================================================
   * Deck Cadet:
   *   - Engine Watch ALWAYS counts as watchkeeping.
   *
   * Engine Cadet:
   *   - Counts as watchkeeping if ANY is true:
   *     1) engineWatchType === "MANNED"
   *     2) engineRunning === true AND manoeuvring === true
   *     3) engineWatchType === "STANDBY" AND manoeuvring === true
   *
   * NOTE:
   * - This is stored in engine payload for later STCW calculations / review.
   * ============================================================
   */
const getEngineWatchQualifiesAsWatch = (): boolean => {
  // DEV override until profile wiring
  if (DEV_CADET_STREAM === "DECK") return true;

  // Engine Cadet — Option B logic
  const isManned = engineWatchType === "MANNED";
  const isRunningDuringManoeuvring = engineRunning && manoeuvring;
  const isStandbyDuringCriticalOps =
    engineWatchType === "STANDBY" && manoeuvring;

  return isManned || isRunningDuringManoeuvring || isStandbyDuringCriticalOps;
};



  // --- Machinery Status (enabled only if engineRunning === true) ---
  const [mainEngineRunning, setMainEngineRunning] = useState<boolean>(false);

  const [generatorsRunning, setGeneratorsRunning] = useState<{
    DG1: boolean;
    DG2: boolean;
    DG3: boolean;
  }>({
    DG1: false,
    DG2: false,
    DG3: false,
  });

  const [boilerInService, setBoilerInService] = useState<boolean>(false);
  const [steeringGearInUse, setSteeringGearInUse] = useState<boolean>(false);

  // --- Engine Parameters (Accordion – optional) ---
  const [engineLoadPercent, setEngineLoadPercent] = useState<number | null>(
    null
  );

  const [engineRpmRange, setEngineRpmRange] = useState<
    "LOW" | "MEDIUM" | "HIGH" | null
  >(null);

  const [fuelType, setFuelType] = useState<
    "HFO" | "MGO" | "LSFO" | "OTHER" | null
  >(null);

  const [generatorsLoadBalanced, setGeneratorsLoadBalanced] =
    useState<boolean>(true);

  // --- Abnormalities & Rounds ---
  const [roundsCompleted, setRoundsCompleted] = useState<boolean>(false);
  const [roundsCount, setRoundsCount] = useState<number | null>(null);

  const [alarmsObserved, setAlarmsObserved] = useState<boolean>(false);
  const [abnormalRemarks, setAbnormalRemarks] = useState("");


const isTimeRequired = logType !== "DAILY";

/**
 * Port Watch and Bridge Watch may cross midnight,
 * so Start Date + End Date are mandatory for them.
 */
const isDateRangeRequired = logType === "PORT" || logType === "BRIDGE";

const isDailyWorkValid =
  logType === "DAILY" &&
  !!date &&
  startTime &&
  endTime &&
  dailyWorkCategories.length > 0 &&
  (!dailyWorkSummaryRequired || summary.trim().length > 0);

const isFormValid =
  (logType === "DAILY" && isDailyWorkValid) ||
  (logType !== "DAILY" &&
    !!date &&
    summary.trim().length > 0 &&
    (!isTimeRequired ||
      (startTime &&
        endTime &&
        (!isDateRangeRequired ||
          (watchStartDate && watchEndDate)))) &&
    (logType !== "BRIDGE" ||
      (isLatValid && isLonValid && isCourseValid)));



  /* ---------------- DASHBOARD CALCULATIONS ---------------- */
  const dailyWatchTotals = useMemo(
    () => calculateDailyWatchTotals(entries),
    [entries]
  );

  // Selected date key in YYYY-MM-DD (same format used by the aggregation utility).
  const selectedDateKey = date ? date.toISOString().slice(0, 10) : null;

  // Totals for the selected day; undefined means "no watch logs for that date".
  const selectedDayTotals = selectedDateKey
    ? dailyWatchTotals.find((d) => d.dateKey === selectedDateKey)
    : undefined;

    /* =======================
   WEEKLY WATCH TOTALS (STEP 4.4)
   Rolling 7-day window ending on the selected date.
   - STCW-style rolling window (NOT calendar week)
   - Pure calculation, no side effects
   ======================= */

  const weeklyWatchTotals = useMemo(() => {
    if (!date) return null;

    // Uses existing entries + selected date
    return calculateWeeklyWatchTotals(entries, date);
  }, [entries, date]);

  /* =======================
   STCW COMPLIANCE (STEP D6.1)
   Read-only calculation for the selected date.
   - No blocking
   - No alerts
   - UI will consume these values next
   ======================= */

  const stcwCompliance = useMemo(() => {
    if (!date) return null;

    // Uses the full log list and selected date
    return checkStcwCompliance(entries, date);
  }, [entries, date]);

  /* =======================
     AUTO-CLEAR BRIDGE FIELDS
     ======================= */

  useEffect(() => {
    // 🚫 Do not auto-reset fields when editing an existing entry
    if (editingLogId) return;
    if (logType !== "BRIDGE") {
      setLatDeg(null);
      setLatMin(null);
      setLatDir("N");
      setIsLatValid(false);

      setLonDeg(null);
      setLonMin(null);
      setLonDir("E");
      setIsLonValid(false);

      setCourseDeg("");
      setIsCourseValid(true);
      setSpeedKn("");
      setSteeringMinutes(null);
      setWeather("");
      setIsLookout(false);
    }
  }, [logType, editingLogId]);

/**
 * resetForm
 * ---------
 * Resets the form back to "new entry" mode.
 * This MUST NOT be called when entering edit mode.
 */
const resetForm = () => {
  // Exit edit mode
  setEditingLogId(null);

  // Reset form fields for a NEW entry only
  setLogType("DAILY");
  setDate(today);
  setStartTime(null);
  setEndTime(null);

  setSummary("");
  setRemarks("");

  setLatDeg(null);
  setLatMin(null);
  setLatDir("N");
  setIsLatValid(false);

  setLonDeg(null);
  setLonMin(null);
  setLonDir("E");
  setIsLonValid(false);

  setCourseDeg("");
  setIsCourseValid(true);

  setSpeedKn("");
  setSteeringMinutes(null);
  setWeather("");
  setIsLookout(false);
};


  /**
   * buildEngineMachineryPayloadJson
   * ------------------------------
   * Converts current ENGINE UI state into a JSON string for SQLite.
   * We only store this when logType === "ENGINE".
   */
  const buildEngineMachineryPayloadJson = (): string => {
    /**
     * ============================================================
     * ENGINE PAYLOAD (JSON)
     * ============================================================
     * Stored in SQLite column: machinery_monitored
     * We keep it JSON so we can evolve without DB migrations.
     *
     * IMPORTANT:
     * - We store watchQualification so History/STCW engine can use it later.
     * ============================================================
     */
    const qualifiesAsWatch = getEngineWatchQualifiesAsWatch();

    const payload = {
      // Cadet context (temporary local selector until profile wiring)
      cadetStream: DEV_CADET_STREAM,

      // Watchkeeping qualification (Option B logic for engine cadets)
      qualifiesAsWatch,

      // High-level context
      engineWatchType,
      engineRunning,
      manoeuvring,
      engineRoomAttendance,

      // Machinery status
      mainEngineRunning,
      generatorsRunning,
      boilerInService,
      steeringGearInUse,

      // Optional parameters
      engineLoadPercent,
      engineRpmRange,
      fuelType,

      // Power management
      generatorsLoadBalanced,

      // Rounds & abnormalities
      roundsCompleted,
      roundsCount,
      alarmsObserved,
      abnormalRemarks,
    };

    return JSON.stringify(payload);
  };




  /* =======================
     CRUD
     ======================= */

       /**
   * ============================================================
   * SAVE-TIME CONVERSION HELPERS (CRITICAL)
   * ============================================================
   * UI stores:
   * - courseDeg as string (to preserve leading zeros like "012")
   * - speedKn as string (to allow free typing like "12.3")
   *
   * DB + entries require:
   * - courseDeg: number | null
   * - speedKn: number | null
   *
   * Rule:
   * - Convert ONLY at save/update time.
   * - Keep UI state as string.
   */

  const toNullableCourseDegNumber = (value: string): number | null => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return null;

    // Only digits allowed for course
    if (!/^\d{1,3}$/.test(trimmed)) return null;

    const n = Number(trimmed);
    if (!Number.isFinite(n)) return null;

    // Course must be 0..359 (marine standard)
    const normalized = Math.max(0, Math.min(359, n));
    return normalized;
  };

  const toNullableSpeedKnNumber = (value: string): number | null => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return null;

    // Allow digits with optional one decimal point
    if (!/^\d*\.?\d*$/.test(trimmed)) return null;

    const n = Number(trimmed);
    if (!Number.isFinite(n)) return null;

    // Speed cannot be negative
    return Math.max(0, n);
  };

  /**
   * ============================================================
   * UI FORMATTERS (BLUR-ONLY)
   * ============================================================
   * These functions affect DISPLAY ONLY.
   * They DO NOT change DB behavior.
   */

  const formatCourseDegOnBlur = () => {
    const trimmed = courseDeg.trim();
    if (!trimmed) return;

    // Only digits allowed
    if (!/^\d{1,3}$/.test(trimmed)) return;

    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;

    // Clamp to 0–359 and pad to 3 digits
    const normalized = Math.max(0, Math.min(359, n));
    setCourseDeg(normalized.toString().padStart(3, "0"));
  };

  const formatSpeedKnOnBlur = () => {
    const trimmed = speedKn.trim();
    if (!trimmed) return;

    // Allow digits with max one decimal
    if (!/^\d*\.?\d*$/.test(trimmed)) return;

    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;

    // Preserve user intent, do not force decimals yet
    setSpeedKn(n.toString());
  };

  /**
 * ============================================================
 * Date + Time merge utility (midnight-safe watches)
 * ============================================================
 * TimeInputField gives us a Date object containing a time-of-day.
 * We merge that time onto the chosen Start/End Date so DB stores
 * correct absolute timestamps (required for overlap + STCW).
 */
const mergeDateAndTime = (datePart: Date | null, timePart: Date | null) => {
  if (!datePart || !timePart) return null;

  const merged = new Date(datePart);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
};


const handleSave = () => {
  if (!isFormValid) return;

  /**
   * ------------------------------------------------------------
   * Effective period (Port Watch must be midnight-safe)
   * ------------------------------------------------------------
   * - For Port Watch: use watchStartDate/watchEndDate + time
   * - For others: keep existing behavior (date + start/end time)
   */
  const effectiveDate = logType === "PORT" ? watchStartDate : date;
  const effectiveStart =
    logType === "PORT"
      ? mergeDateAndTime(watchStartDate, startTime)
      : startTime;
  const effectiveEnd =
    logType === "PORT"
      ? mergeDateAndTime(watchEndDate, endTime)
      : endTime;

  // Hard safety: prevent invalid period
  if (isTimeRequired && (!effectiveStart || !effectiveEnd)) return;

  if (logType === "PORT" && effectiveStart && effectiveEnd && effectiveEnd <= effectiveStart) {
    Toast.show({
      type: "error",
      text1: "Invalid Port Watch period",
      text2: "End must be after Start. If crossing midnight, set End Date to the next day.",
      position: "bottom",
    });
    return;
  }

  // Overlap check must use effective times (critical for midnight overlap correctness)
  const overlapping = findOverlappingEntry(entries, {
    date: effectiveDate!,
    startTime: effectiveStart,
    endTime: effectiveEnd,
  });

  if (overlapping) {
    Toast.show({
      type: "error",
      text1: "Time overlap detected",
      text2:
        overlapping.startTime && overlapping.endTime
          ? `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} (${overlapping.startTime.toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit", hour12: false }
            )}–${overlapping.endTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })})`
          : `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} entry`,
      position: "bottom",
    });
    return;
  }

  // ============================================================
  // 1) Convert UI strings → numbers ONLY here (save-time)
  // ============================================================
  const courseDegNumber = toNullableCourseDegNumber(courseDeg);
  const speedKnNumber = toNullableSpeedKnNumber(speedKn);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const machineryMonitored =
    logType === "ENGINE" ? buildEngineMachineryPayloadJson() : null;

  // ============================================================
  // 2) DB write must match DailyLogDBInput (numbers, not strings)
  //    Port Watch must save as type="PORT"
  // ============================================================
  insertDailyLog({
    id,
    date: (effectiveDate ?? date!)!.toISOString(),

    type: logType,

    portWatchType: portWatchType === "SECURITY" ? "GANGWAY" : portWatchType,

    startTime: isTimeRequired ? effectiveStart!.toISOString() : undefined,
    endTime: isTimeRequired ? effectiveEnd!.toISOString() : undefined,

    summary: summary.trim(),
    remarks: remarks.trim() || undefined,

    latDeg,
    latMin,
    latDir,
    lonDeg,
    lonMin,
    lonDir,

    courseDeg: courseDegNumber,
    speedKn: speedKnNumber,

    weather: weather || null,
    steeringMinutes,
    isLookout,

    machineryMonitored,
  });

  /**
   * STCW PREVIEW CALCULATION (CRITICAL)
   * Port Watch must be included as work-time (type="PORT")
   */
  const previewEntries: DailyLogEntry[] = [
    {
      id,
      date: (effectiveDate ?? date!)!,
      type: logType,
      portWatchType: logType === "PORT" ? portWatchType : null,
      startTime: effectiveStart ?? undefined,
      endTime: effectiveEnd ?? undefined,
      summary,
      remarks,
      latDeg,
      latMin,
      latDir,
      lonDeg,
      lonMin,
      lonDir,
      courseDeg: courseDegNumber,
      speedKn: speedKnNumber,
      weather,
      steeringMinutes,
      isLookout,
      machineryMonitored,
    },
    ...entries,
  ];

  const previewStcwCompliance = checkStcwCompliance(previewEntries, (effectiveDate ?? date!)!);

  // ============================================================
  // 3) Local UI list must also store numbers + PORT info
  // ============================================================
  setEntries((p) => [
    {
      id,
      date: (effectiveDate ?? date!)!,
      type: logType,
      portWatchType: logType === "PORT" ? portWatchType : null,
      startTime: effectiveStart ?? undefined,
      endTime: effectiveEnd ?? undefined,
      summary,
      remarks,
      latDeg,
      latMin,
      latDir,
      lonDeg,
      lonMin,
      lonDir,
      courseDeg: courseDegNumber,
      speedKn: speedKnNumber,
      weather,
      steeringMinutes,
      isLookout,
      machineryMonitored,
    },
    ...p,
  ]);

  Toast.show({
    type: "success",
    text1: "Log entry saved",
    text2: "Your watch entry has been recorded successfully.",
    position: "bottom",
  });

  // (Existing advisory toasts below remain unchanged)
  // NOTE: previewStcwCompliance is already computed above for correctness.
};




  /**
 * hydrateEngineStateFromJson
 * --------------------------
 * Restores ENGINE watch UI state from machinery_monitored JSON.
 * Safe against corrupt / missing data.
 */
const hydrateEngineStateFromJson = (json: string | null) => {
  if (!json) return;

  try {
    const data = JSON.parse(json);

    setEngineWatchType(data.engineWatchType ?? null);
    setEngineRunning(!!data.engineRunning);
    setManoeuvring(!!data.manoeuvring);
    setEngineRoomAttendance(data.engineRoomAttendance ?? null);

    setMainEngineRunning(!!data.mainEngineRunning);
    setGeneratorsRunning(
      data.generatorsRunning ?? { DG1: false, DG2: false, DG3: false }
    );
    setBoilerInService(!!data.boilerInService);
    setSteeringGearInUse(!!data.steeringGearInUse);

    setEngineLoadPercent(data.engineLoadPercent ?? null);
    setEngineRpmRange(data.engineRpmRange ?? null);
    setFuelType(data.fuelType ?? null);
    setGeneratorsLoadBalanced(
      data.generatorsLoadBalanced ?? true
    );

    setRoundsCompleted(!!data.roundsCompleted);
    setRoundsCount(data.roundsCount ?? null);
    setAlarmsObserved(!!data.alarmsObserved);
    setAbnormalRemarks(data.abnormalRemarks ?? "");
  } catch (e) {
    console.warn("Failed to parse machinery_monitored", e);
  }
};


    /**
     * handleEdit
     * ----------
     * Loads an existing log entry into the LOG form.
     * Also shows a diagnostic toast so we can confirm what data is received.
     */
    const handleEdit = (entry: DailyLogEntry) => {
    // 1️⃣ Switch to the correct tab (Phase D2.1)
    // - DAILY entries belong to Daily Work tab
    // - BRIDGE/ENGINE entries belong to Sea Watch tab
    if (entry.type === "DAILY") {
      setActiveTab("DAILY_WORK");
    } else {
      setActiveTab("SEA_WATCH");
    }


    // 2️⃣ Mark edit mode
    setEditingLogId(entry.id);

    // 3️⃣ Common fields
    setLogType(entry.type);
    setDate(entry.date);
    setStartTime(entry.startTime ?? null);
    setEndTime(entry.endTime ?? null);
    setSummary(entry.summary ?? ""); // safety
    setRemarks(entry.remarks ?? "");

    // 4️⃣ Bridge fields (hydration + validity)
    if (entry.type === "BRIDGE") {
        setLatDeg(entry.latDeg ?? null);
        setLatMin(entry.latMin ?? null);
        setLatDir((entry.latDir as any) ?? "N");

        setLonDeg(entry.lonDeg ?? null);
        setLonMin(entry.lonMin ?? null);
        setLonDir((entry.lonDir as any) ?? "E");

        setCourseDeg((entry.courseDeg as any) ?? "");
        setSpeedKn((entry.speedKn as any) ?? "");
        setWeather((entry.weather as any) ?? "");
        setSteeringMinutes(entry.steeringMinutes ?? null);
        setIsLookout(!!entry.isLookout);


        // IMPORTANT:
        // For edit mode, we mark these valid so the user can update without fighting validation.
        setIsLatValid(true);
        setIsLonValid(true);
        setIsCourseValid(true);
    } else {
        // Reset Bridge-only state if not Bridge
        setLatDeg(null);
        setLatMin(null);
        setLatDir("N");
        setLonDeg(null);
        setLonMin(null);
        setLonDir("E");
        setCourseDeg("");
        setSpeedKn("");
        setSteeringMinutes(null);
        setWeather("");
        setIsLookout(false);

        setIsLatValid(true);
        setIsLonValid(true);
        setIsCourseValid(true);
    }

// 5️⃣ Engine UI state (restore or reset)
if (entry.type === "ENGINE" && entry.machineryMonitored) {
  try {
    const payload = JSON.parse(entry.machineryMonitored);

    setEngineWatchType(payload.engineWatchType ?? null);
    setEngineRunning(payload.engineRunning ?? false);
    setManoeuvring(payload.manoeuvring ?? false);
    setEngineRoomAttendance(payload.engineRoomAttendance ?? null);

    setMainEngineRunning(payload.mainEngineRunning ?? false);
    setGeneratorsRunning(payload.generatorsRunning ?? { DG1: false, DG2: false, DG3: false });
    setBoilerInService(payload.boilerInService ?? false);
    setSteeringGearInUse(payload.steeringGearInUse ?? false);

    setEngineLoadPercent(payload.engineLoadPercent ?? null);
    setEngineRpmRange(payload.engineRpmRange ?? null);
    setFuelType(payload.fuelType ?? null);
    setGeneratorsLoadBalanced(payload.generatorsLoadBalanced ?? true);

    setRoundsCompleted(payload.roundsCompleted ?? false);
    setRoundsCount(payload.roundsCount ?? null);
    setAlarmsObserved(payload.alarmsObserved ?? false);
    setAbnormalRemarks(payload.abnormalRemarks ?? "");
  } catch {
    // Safety: corrupted JSON should not crash UI
    setEngineRunning(false);
  }
} else {
// Full reset of ALL engine-related UI state
  setEngineWatchType(null);
  setEngineRunning(false);
  setManoeuvring(false);
  setEngineRoomAttendance(null);

  setMainEngineRunning(false);
  setGeneratorsRunning({ DG1: false, DG2: false, DG3: false });
  setBoilerInService(false);
  setSteeringGearInUse(false);

  setEngineLoadPercent(null);
  setEngineRpmRange(null);
  setFuelType(null);
  setGeneratorsLoadBalanced(true);

  setRoundsCompleted(false);
  setRoundsCount(null);
  setAlarmsObserved(false);
  setAbnormalRemarks("");
}


    // 6️⃣ DIAGNOSTIC TOAST (TEMPORARY)
    // This confirms whether the entry passed into handleEdit actually contains data.
    Toast.show({
        type: "info",
        text1: "Edit diagnostic",
        text2: `type=${entry.type} | summaryLen=${(entry.summary ?? "").length} | start=${entry.startTime ? "Y" : "N"} | end=${entry.endTime ? "Y" : "N"} | remarksLen=${(entry.remarks ?? "").length}`,
        position: "bottom",
    });
    };



  const handleUpdate = () => {
    if (!editingLogId || !isFormValid) return;

    const overlapping = findOverlappingEntry(entries, {
      id: editingLogId,
      date: date!,
      startTime,
      endTime,
    });

    if (overlapping) {
      Toast.show({
        type: "error",
        text1: "Time overlap detected",
        text2:
          overlapping.startTime && overlapping.endTime
            ? `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} (${overlapping.startTime.toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit", hour12: false }
              )}–${overlapping.endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })})`
            : `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} entry`,
        position: "bottom",
      });
      return;
    }

    // ============================================================
    // 1) Convert UI strings → numbers ONLY here (update-time)
    // ============================================================
    const courseDegNumber = toNullableCourseDegNumber(courseDeg);
    const speedKnNumber = toNullableSpeedKnNumber(speedKn);

    const machineryMonitored =
      logType === "ENGINE" ? buildEngineMachineryPayloadJson() : null;

    // ============================================================
    // 2) Build a strongly-typed patch object for BOTH:
    //    - DB write (DailyLogDBInput expects numbers)
    //    - Local entries update (DailyLogEntry expects numbers)
    // ============================================================
    const updatedEntry: Partial<DailyLogEntry> = {
      date: date!,
      type: logType,
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
      summary: summary.trim(),
      remarks: remarks.trim() || undefined,
      latDeg,
      latMin,
      latDir,
      lonDeg,
      lonMin,
      lonDir,

      // IMPORTANT: numbers stored in entries
      courseDeg: courseDegNumber,
      speedKn: speedKnNumber,

      weather: weather || null,
      steeringMinutes,
      isLookout,
      machineryMonitored,
    };

    updateDailyLog({
      id: editingLogId,
      date: date!.toISOString(),
      type: logType,
      startTime: isTimeRequired ? startTime!.toISOString() : undefined,
      endTime: isTimeRequired ? endTime!.toISOString() : undefined,
      summary: summary.trim(),
      remarks: remarks.trim() || undefined,
      latDeg,
      latMin,
      latDir,
      lonDeg,
      lonMin,
      lonDir,

      // IMPORTANT: numeric conversions
      courseDeg: courseDegNumber,
      speedKn: speedKnNumber,

      weather: weather || null,
      steeringMinutes,
      isLookout,
      machineryMonitored,
    });

    // ============================================================
    // 3) Update local list safely (NO arguments[0] hack)
    // ============================================================
    setEntries((prev) =>
      prev.map((e) => (e.id === editingLogId ? ({ ...e, ...updatedEntry } as DailyLogEntry) : e))
    );

    Toast.show({
      type: "success",
      text1: "Log entry updated",
      text2: "Changes have been saved.",
      position: "bottom",
    });

    resetForm();
    refreshLogs();
  };


  const confirmDelete = (id: string) => {
    Alert.alert("Delete Log", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteDailyLogById(id);
          setEntries((p) => p.filter((e) => e.id !== id));

            // Success feedback for delete
            Toast.show({
                type: "success",
                text1: "Log entry deleted",
                text2: "The selected entry has been removed.",
                position: "bottom",
            });
        },
      },
    ]);
  };

  /* =======================
     UI
     ======================= */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
      >
        <Text variant="headlineMedium">Diary & Watchkeeping</Text>

        {/* ---------------- TAB BAR (Top-level Intent) ----------------
        {/* ============================================================
            TOP-LEVEL MODE SELECTOR (Segmented UX)
            - Large touch targets
            - Clear active state
            - Inspector / cadet friendly
           ============================================================ */}
{/* ============================================================
    PRIMARY MODE SELECTOR
    Large, readable, cadet-friendly
   ============================================================ */}
<View style={{ flexDirection: "row", gap: 12, marginVertical: 16 }}>
  <Button
    mode={primaryMode === "LOG" ? "contained" : "outlined"}
    onPress={() => setPrimaryMode("LOG")}
    style={{ flex: 1 }}
  >
    Create Log Entry
  </Button>

  <Button
    mode={primaryMode === "REVIEW" ? "contained" : "outlined"}
    onPress={() => setPrimaryMode("REVIEW")}
    style={{ flex: 1 }}
  >
    Review Logs
  </Button>
</View>

{/* ============================================================
    REVIEW MODE — HISTORY ONLY
    - No dashboard
    - No status
    - Edit/Delete only here
   ============================================================ */}
{primaryMode === "REVIEW" && (
  <>
    <Text
      variant="titleMedium"
      style={{ marginBottom: 12, marginTop: 8 }}
    >
      Log History
    </Text>

    {entries.length === 0 && (
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text style={{ opacity: 0.7 }}>
            No log entries recorded yet.
          </Text>
        </Card.Content>
      </Card>
    )}

    {entries.map((e) => (
      <Card
        key={e.id}
        style={[
          styles.logCard,
          {
            backgroundColor:
              (theme as any)?.colors?.elevation?.level1 ??
              theme.colors.surface,
          },
        ]}
      >
        <Card.Content>
          {/* ================= HEADER ================= */}
          <View style={styles.logHeader}>
            <View>
              <Text
                variant="titleSmall"
                style={{ fontWeight: "700" }}
              >
                {LOG_TYPE_LABEL[e.type]}
              </Text>

              <Text
                variant="bodySmall"
                style={{ opacity: 0.7 }}
              >
                {e.date.toDateString()}
              </Text>
            </View>

            {/* ACTIONS — ONLY IN HISTORY */}
            <View style={styles.iconRow}>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => handleEdit(e)}
                accessibilityLabel="Edit log"
              />

              <IconButton
                icon="trash-can-outline"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => confirmDelete(e.id)}
                accessibilityLabel="Delete log"
              />
            </View>
          </View>

          {/* ================= TIME RANGE ================= */}
          {e.startTime && e.endTime && (
            <Text
              variant="bodySmall"
              style={{ marginTop: 6, opacity: 0.7 }}
            >
              {`${e.startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })} – ${e.endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}`}
            </Text>
          )}

          {/* ================= DURATION ================= */}
          {(() => {
            const mins = calculateDurationMinutes(
              e.startTime,
              e.endTime
            );
            if (!mins) return null;

            return (
              <Text
                variant="bodySmall"
                style={{ opacity: 0.7 }}
              >
                Duration: {formatMinutesToHoursMinutes(mins)}
              </Text>
            );
          })()}

          {/* ================= SUMMARY ================= */}
          <Text
            style={{
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            {e.summary}
          </Text>

          {/* ================= ENGINE SUMMARY (READ-ONLY) ================= */}
          {e.type === "ENGINE" &&
            (() => {
              const engineSummary =
                buildEngineSummaryText(e.machineryMonitored);
              if (!engineSummary) return null;

              return (
                <Text
                  variant="bodySmall"
                  style={{
                    marginTop: 6,
                    opacity: 0.75,
                    fontStyle: "italic",
                  }}
                >
                  {engineSummary}
                </Text>
              );
            })()}
        </Card.Content>
      </Card>
    ))}
  </>
)}


{/* ============================================================
    DUTY TYPE SELECTION — CAPSULE SEGMENTED CONTROL
    - Mode selection (not a list)
    - Large touch targets
    - Maritime-friendly UX
   ============================================================ */}
{primaryMode === "LOG" && (
  <>
    {/* ================= DUTY TYPE ================= */}
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
          Select Duty Type
        </Text>

        <View style={styles.capsuleContainer}>
          <Pressable
            onPress={() => setDutyMode("DAILY_WORK")}
            style={[
              styles.capsuleSegment,
              styles.capsuleLeft,
              dutyMode === "DAILY_WORK" && styles.capsuleActive,
            ]}
          >
            <Text
              style={[
                styles.capsuleText,
                dutyMode === "DAILY_WORK" && styles.capsuleTextActive,
              ]}
            >
              Daily Work
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDutyMode("SEA_WATCH")}
            style={[
              styles.capsuleSegment,
              dutyMode === "SEA_WATCH" && styles.capsuleActive,
            ]}
          >
            <Text
              style={[
                styles.capsuleText,
                dutyMode === "SEA_WATCH" && styles.capsuleTextActive,
              ]}
            >
              Sea Watch
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDutyMode("PORT_WATCH")}
            style={[
              styles.capsuleSegment,
              styles.capsuleRight,
              dutyMode === "PORT_WATCH" && styles.capsuleActive,
            ]}
          >
            <Text
              style={[
                styles.capsuleText,
                dutyMode === "PORT_WATCH" && styles.capsuleTextActive,
              ]}
            >
              Port Watch
            </Text>
          </Pressable>
        </View>
      </Card.Content>
    </Card>


    {/* ================= SAVE BAR ================= */}
    <View
      style={{
        marginTop: 24,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <Button
        mode="contained"
        onPress={editingLogId ? handleUpdate : handleSave}
        disabled={!isFormValid}
      >
        {editingLogId ? "Update Entry" : "Save Entry"}
      </Button>
    </View>
  </>
)}




{/* ============================================================
    SEA WATCH TYPE — CAPSULE SEGMENTED CONTROL
    Visible only when Duty Type = Sea Watch
   ============================================================ */}
  {primaryMode === "LOG" && dutyMode === "SEA_WATCH" && (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
          Sea Watch Type
        </Text>

        <View style={styles.capsuleContainer}>
          {/* Bridge Watch */}
          <Pressable
            onPress={() => setSeaWatchMode("BRIDGE")}
            style={[
              styles.capsuleSegment,
              styles.capsuleLeft,
              seaWatchMode === "BRIDGE" && styles.capsuleActive,
            ]}
          >
            <Text
              style={[
                styles.capsuleText,
                seaWatchMode === "BRIDGE" && styles.capsuleTextActive,
              ]}
            >
              Bridge Watch
            </Text>
          </Pressable>

          {/* Engine Watch */}
          <Pressable
            onPress={() => setSeaWatchMode("ENGINE")}
            style={[
              styles.capsuleSegment,
              styles.capsuleRight,
              seaWatchMode === "ENGINE" && styles.capsuleActive,
            ]}
          >
            <Text
              style={[
                styles.capsuleText,
                seaWatchMode === "ENGINE" && styles.capsuleTextActive,
              ]}
            >
              Engine Watch
            </Text>
          </Pressable>
        </View>
      </Card.Content>
    </Card>
  )}

{/* ============================================================
    DAILY WORK FORM — D2
    Time-bound, STCW-relevant, NON-WATCH work
   ============================================================ */}
{primaryMode === "LOG" && dutyMode === "DAILY_WORK" && (
  <Card style={{ marginBottom: 16 }}>
    <Card.Content>
      <Text style={styles.sectionTitle}>Daily Work Log</Text>

      <Card style={{ marginBottom: 12, backgroundColor: "#FFF7ED" }}>
        <Card.Content>
          <Text style={{ fontSize: 13, color: "#9A3412" }}>
            This entry counts as WORK for STCW rest compliance, but is NOT a watch.
          </Text>
        </Card.Content>
      </Card>

      {/* -------- Date & Time -------- */}
      <Text style={styles.fieldLabel}>Work Period</Text>

      <DateInputField
        label="Date *"
        value={date}
        onChange={setDate}
        required
      />

      <View style={{ height: 10 }} />

      <TimeInputField
        label="Start Time (24h) *"
        value={startTime}
        onChange={setStartTime}
      />

      <View style={{ height: 10 }} />

      <TimeInputField
        label="End Time (24h) *"
        value={endTime}
        onChange={setEndTime}
      />

      {/* -------- Category Selection -------- */}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.fieldLabel}>
          Nature of Work (select at least one)
        </Text>

        {DAILY_WORK_CATEGORIES.map((c) => (
          <View
            key={c.key}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
          >
            <Checkbox
              status={
                dailyWorkCategories.includes(c.key)
                  ? "checked"
                  : "unchecked"
              }
              onPress={() => toggleDailyWorkCategory(c.key)}
            />
            <Text onPress={() => toggleDailyWorkCategory(c.key)}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>

      {/* -------- Summary -------- */}
      <TextInput
        mode="outlined"
        label={
          dailyWorkSummaryRequired
            ? "Summary (required)"
            : "Summary (optional)"
        }
        placeholder="Short factual description (for audit / review)"
        value={summary}
        onChangeText={setSummary}
        multiline
        style={{ marginTop: 12 }}
      />

      {/* -------- Remarks -------- */}
      <TextInput
        mode="outlined"
        label="Remarks (optional)"
        value={remarks}
        onChangeText={setRemarks}
        multiline
        style={{ marginTop: 10 }}
      />
    </Card.Content>
  </Card>
)}


{/* ============================================================
    BRIDGE WATCH FORM — UI (Step D4.1)
    Visible only when:
    - Primary Mode = LOG
    - Duty Type = Sea Watch
    - Sea Watch Type = Bridge Watch
   ============================================================ */}
{primaryMode === "LOG" && dutyMode === "SEA_WATCH" && seaWatchMode === "BRIDGE" && (
  <Card style={{ marginBottom: 16 }}>
    <Card.Content>
    <Text style={styles.sectionTitle}>Bridge Watch</Text>

<Card style={{ marginBottom: 12, backgroundColor: "#E6F4F6" }}>
  <Card.Content>
    <Text style={{ fontSize: 13, color: "#055160" }}>
      This entry will be counted as Bridge Watch for STCW watchkeeping hours.
    </Text>
  </Card.Content>
</Card>

      {/* =========================================================
          BRIDGE WATCH PERIOD
          Start / End Date & Time (midnight-safe)
        ========================================================= */}

      <Text style={styles.fieldLabel}>Watch Period</Text>

      <DateInputField
        label="Start Date *"
        value={watchStartDate}
        onChange={setWatchStartDate}
        required
      />
      <View style={{ height: 10 }} />

      <TimeInputField
        label="Start Time (24h) *"
        value={startTime}
        onChange={setStartTime}
      />
      <View style={{ height: 10 }} />

      <DateInputField
        label="End Date *"
        value={watchEndDate}
        onChange={setWatchEndDate}
        required
      />
      <View style={{ height: 10 }} />

      <TimeInputField
        label="End Time (24h) *"
        value={endTime}
        onChange={setEndTime}
      />

      <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
        If the watch crosses midnight, select the next date as End Date.
      </Text>


      <View style={{ height: 14 }} />
{/* =========================================================
    BRIDGE WATCH POSITION
    Single-input DD°MM.mm / DDD°MM.mm with hemisphere capsule
    ========================================================= */}

<Text style={styles.fieldLabel}>Position</Text>

<LatLongInput
  label="Latitude"
  type="LAT"
  degrees={latDeg}
  minutes={latMin}
  direction={latDir}
  onChange={(v) => {
    setLatDeg(v.degrees);
    setLatMin(v.minutes);
    setLatDir(v.direction as "N" | "S");
    setIsLatValid(v.isValid);
  }}
/>

<LatLongInput
  label="Longitude"
  type="LON"
  degrees={lonDeg}
  minutes={lonMin}
  direction={lonDir}
  onChange={(v) => {
    setLonDeg(v.degrees);
    setLonMin(v.minutes);
    setLonDir(v.direction as "E" | "W");
    setIsLonValid(v.isValid);
  }}
/>


      <View style={{ height: 14 }} />

<Text style={styles.fieldLabel}>Navigation</Text>

      {/* ----------------------------
          Navigation / Conning
          ---------------------------- */}
      {/* =======================
          Navigation – Course
          Stored as STRING to preserve leading zeros
        ======================= */}
      <TextInput
        mode="outlined"
        label="Course (°)"
        value={courseDeg}
        keyboardType="number-pad"
        onChangeText={(t) => {
          // Allow only digits, max 3
          if (!/^\d{0,3}$/.test(t)) return;

          setCourseDeg(t);

          if (t === "") {
            setIsCourseValid(true);
            return;
          }

          const n = Number(t);
          setIsCourseValid(n >= 0 && n <= 359);
        }}
        onBlur={() => {
          if (courseDeg === "") return;

          const n = Number(courseDeg);
          if (!Number.isFinite(n)) return;

          const normalized = Math.max(0, Math.min(359, n));
          setCourseDeg(String(normalized).padStart(3, "0"));
        }}
        style={{ marginBottom: 6 }}
      />

      {!isCourseValid && (
        <Text style={{ marginBottom: 10, color: theme.colors.error }}>
          Course must be between 000° and 359°.
        </Text>
      )}


      {/* =======================
          Navigation – Speed
          Free decimal typing, normalize on blur
        ======================= */}
      <TextInput
        mode="outlined"
        label="Speed (knots)"
        value={speedKn}
        keyboardType="decimal-pad"
        onChangeText={(t) => {
          // Allow empty
          if (t === "") {
            setSpeedKn("");
            return;
          }

          // Allow digits + one decimal
          if (!/^\d*\.?\d*$/.test(t)) return;

          setSpeedKn(t);
        }}
        onBlur={() => {
          if (speedKn === "") return;

          const n = Number(speedKn);
          if (!Number.isFinite(n)) return;

          setSpeedKn(n.toFixed(1));
        }}
        style={{ marginBottom: 10 }}
      />




      <TextInput
        mode="outlined"
        label="Weather / Sea state (short)"
        placeholder="e.g. Clear, Rain, SW swell, Beaufort 4"
        value={weather}
        onChangeText={setWeather}
        style={{ marginBottom: 10 }}
      />

<Text style={styles.fieldLabel}>Duties Performed</Text>

      {/* ----------------------------
          Steering + Lookout (STCW relevant)
          ---------------------------- */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Checkbox
          status={steeringGearInUse ? "checked" : "unchecked"}
          onPress={() => setSteeringGearInUse(!steeringGearInUse)}
        />
        <Text onPress={() => setSteeringGearInUse(!steeringGearInUse)}>
          Hand steering carried out during this watch
        </Text>
      </View>

      {steeringGearInUse && (
        <TextInput
          mode="outlined"
          label="Steering minutes"
          value={steeringMinutes == null ? "" : String(steeringMinutes)}
          keyboardType="number-pad"
          onChangeText={(t) => {
            const n = t.trim() === "" ? null : Number(t);
            setSteeringMinutes(n);
          }}
          style={{ marginBottom: 10 }}
        />
      )}

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Checkbox
          status={isLookout ? "checked" : "unchecked"}
          onPress={() => setIsLookout(!isLookout)}
        />
        <Text onPress={() => setIsLookout(!isLookout)}>
          I was assigned lookout duties (counts toward watchkeeping record)
        </Text>
      </View>

      {/* ----------------------------
          Summary + Remarks (required for Save validation)
          ---------------------------- */}
      <TextInput
        mode="outlined"
        label="Summary (required)"
        placeholder="Short, factual watch summary for TRB audit"
        value={summary}
        onChangeText={setSummary}
        multiline
        style={{ marginBottom: 10 }}
      />

      <TextInput
        mode="outlined"
        label="Remarks (optional)"
        value={remarks}
        onChangeText={setRemarks}
        multiline
      />
    </Card.Content>
  </Card>
)}

{/* ============================================================
    ENGINE WATCH FORM — D3 (Option B)
    - Deck Cadet: always counts as watchkeeping
    - Engine Cadet: counts as watchkeeping only if qualified (Option B)
   ============================================================ */}
{primaryMode === "LOG" &&
  dutyMode === "SEA_WATCH" &&
  seaWatchMode === "ENGINE" && (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Engine Watch</Text>

        {/* Context banner */}
        <Card style={{ marginBottom: 12, backgroundColor: "#FFF7ED" }}>
          <Card.Content>
            <Text style={{ fontSize: 13, color: "#9A3412" }}>
              Deck Cadet: Engine Watch always counts as watchkeeping. Engine Cadet:
              only counts when conditions qualify (Option B).
            </Text>
          </Card.Content>
        </Card>


        {/* Engine watch type */}
        <Text style={styles.fieldLabel}>Engine Watch Type</Text>
 <Text style={styles.fieldLabel}>Engine Watch Type</Text>

<View style={[styles.capsuleContainer, { marginBottom: 12 }]}>
  <Pressable
    onPress={() => setEngineWatchType("UMS")}
    style={[
      styles.capsuleSegment,
      styles.capsuleLeft,
      engineWatchType === "UMS" && styles.capsuleActive,
    ]}
  >
    <Text
      style={[
        styles.capsuleText,
        engineWatchType === "UMS" && styles.capsuleTextActive,
      ]}
    >
      UMS
    </Text>
  </Pressable>

  <Pressable
    onPress={() => setEngineWatchType("MANNED")}
    style={[
      styles.capsuleSegment,
      engineWatchType === "MANNED" && styles.capsuleActive,
    ]}
  >
    <Text
      style={[
        styles.capsuleText,
        engineWatchType === "MANNED" && styles.capsuleTextActive,
      ]}
    >
      Manned
    </Text>
  </Pressable>

  <Pressable
    onPress={() => setEngineWatchType("STANDBY")}
    style={[
      styles.capsuleSegment,
      styles.capsuleRight,
      engineWatchType === "STANDBY" && styles.capsuleActive,
    ]}
  >
    <Text
      style={[
        styles.capsuleText,
        engineWatchType === "STANDBY" && styles.capsuleTextActive,
      ]}
    >
      Standby
    </Text>
  </Pressable>
</View>


        <Divider style={{ marginVertical: 12 }} />

        {/* Engine running */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Checkbox
            status={engineRunning ? "checked" : "unchecked"}
            onPress={() => setEngineRunning((p) => !p)}
          />
          <Text onPress={() => setEngineRunning((p) => !p)}>
            Engine running during this watch
          </Text>
        </View>

        {/* Manoeuvring / critical ops */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Checkbox
            status={manoeuvring ? "checked" : "unchecked"}
            onPress={() => setManoeuvring((p) => !p)}
          />
          <Text onPress={() => setManoeuvring((p) => !p)}>
            Manoeuvring / critical operations
          </Text>
        </View>

        {/* Qualification preview (user confidence) */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ opacity: 0.75 }}>
            Watchkeeping status:{" "}
            <Text style={{ fontWeight: "700" }}>
              {getEngineWatchQualifiesAsWatch()
                ? "Counts as WATCHKEEPING"
                : "Counts as WORK only"}
            </Text>
          </Text>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        {/* Time + summary/remarks reuse the existing shared fields */}
        <Text style={styles.fieldLabel}>Engine Watch Period</Text>

        <DateInputField label="Date *" value={date} onChange={setDate} required />

        <View style={{ height: 10 }} />

        <TimeInputField
          label="Start Time (24h) *"
          value={startTime}
          onChange={setStartTime}
        />

        <View style={{ height: 10 }} />

        <TimeInputField
          label="End Time (24h) *"
          value={endTime}
          onChange={setEndTime}
        />

{/* ============================================================
    ENGINE PARAMETERS — OPTIONAL (ACCORDION)
    Secondary information for Engine Watch
   ============================================================ */}
<Divider style={{ marginVertical: 12 }} />

<Card style={{ backgroundColor: "#F8FAFC" }}>
  <Card.Content>

    <Text style={styles.fieldLabel}>
      Engine Parameters (Optional)
    </Text>

    {/* Engine Load */}
    <TextInput
      mode="outlined"
      label="Engine Load (%)"
      keyboardType="number-pad"
      value={engineLoadPercent == null ? "" : String(engineLoadPercent)}
      onChangeText={(t) => {
        if (t === "") {
          setEngineLoadPercent(null);
          return;
        }
        const n = Number(t);
        if (!Number.isNaN(n) && n >= 0 && n <= 100) {
          setEngineLoadPercent(n);
        }
      }}
      style={{ marginBottom: 10 }}
    />

    {/* RPM Range */}
    <Text style={styles.fieldLabel}>RPM Range</Text>

    <View style={styles.capsuleContainer}>
      {["LOW", "MEDIUM", "HIGH"].map((r, i) => (
        <Pressable
          key={r}
          onPress={() => setEngineRpmRange(r as any)}
          style={[
            styles.capsuleSegment,
            i === 0 && styles.capsuleLeft,
            i === 2 && styles.capsuleRight,
            engineRpmRange === r && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              engineRpmRange === r && styles.capsuleTextActive,
            ]}
          >
            {r}
          </Text>
        </Pressable>
      ))}
    </View>

    <View style={{ height: 12 }} />

    {/* Fuel Type */}
    <Text style={styles.fieldLabel}>Fuel Type</Text>

    <View style={styles.capsuleContainer}>
      {["HFO", "MGO", "LSFO", "OTHER"].map((f, i) => (
        <Pressable
          key={f}
          onPress={() => setFuelType(f as any)}
          style={[
            styles.capsuleSegment,
            i === 0 && styles.capsuleLeft,
            i === 3 && styles.capsuleRight,
            fuelType === f && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              fuelType === f && styles.capsuleTextActive,
            ]}
          >
            {f}
          </Text>
        </Pressable>
      ))}
    </View>

  </Card.Content>
</Card>

{/* ============================================================
    ENGINE WATCH — SUMMARY & REMARKS
   ============================================================ */}
<TextInput
  mode="outlined"
  label="Summary (required)"
  value={summary}
  onChangeText={setSummary}
  multiline
  style={{ marginTop: 12 }}
/>

<TextInput
  mode="outlined"
  label="Remarks (optional)"
  value={remarks}
  onChangeText={setRemarks}
  multiline
  style={{ marginTop: 10 }}
/>

      </Card.Content>
    </Card>
  )}


{/* ============================================================
    PORT WATCH FORM — D4.1 (Midnight-safe + STCW work hours)
    Capsule types restricted by your rule:
    - Cargo / Anchor / Security / Bunkering
   ============================================================ */}
{primaryMode === "LOG" && dutyMode === "PORT_WATCH" && (
  <Card style={{ marginBottom: 16 }}>
    <Card.Content>
      {/* -------- Port Watch Context Banner -------- */}
      <View
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: "#E6F4F6",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: "700", marginBottom: 4 }}>
          Port Watch Log Entry
        </Text>

        <Text style={{ fontSize: 12, opacity: 0.8 }}>
          Port Watch counts toward STCW work/rest calculations. If duty crosses midnight,
          set End Date to the next day.
        </Text>
      </View>

      {/* -------- Port Watch Type (Capsule) -------- */}
      <Text style={{ marginBottom: 8, fontWeight: "600" }}>
        Port Watch Type
      </Text>

      <View style={styles.capsuleContainer}>
        <Pressable
          onPress={() => setPortWatchType("CARGO")}
          style={[
            styles.capsuleSegment,
            styles.capsuleLeft,
            portWatchType === "CARGO" && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              portWatchType === "CARGO" && styles.capsuleTextActive,
            ]}
          >
            Cargo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPortWatchType("ANCHOR")}
          style={[
            styles.capsuleSegment,
            portWatchType === "ANCHOR" && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              portWatchType === "ANCHOR" && styles.capsuleTextActive,
            ]}
          >
            Anchor
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPortWatchType("SECURITY")}
          style={[
            styles.capsuleSegment,
            portWatchType === "SECURITY" && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              portWatchType === "SECURITY" && styles.capsuleTextActive,
            ]}
          >
            Security
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPortWatchType("BUNKERING")}
          style={[
            styles.capsuleSegment,
            styles.capsuleRight,
            portWatchType === "BUNKERING" && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              portWatchType === "BUNKERING" && styles.capsuleTextActive,
            ]}
          >
            Bunkering
          </Text>
        </Pressable>
      </View>

      {/* -------- Watchkeeping Status Preview (read-only) -------- */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ opacity: 0.75 }}>
          This entry counts as{" "}
          <Text style={{ fontWeight: "700" }}>
            {portWatchType === "ANCHOR" ? "WATCHKEEPING" : "WORK only"}
          </Text>{" "}
          for STCW purposes.
        </Text>
      </View>

      <Divider style={{ marginVertical: 12 }} />

      {/* -------- Port Watch Period (midnight-safe) -------- */}
      <Text style={styles.fieldLabel}>Port Watch Period</Text>

      <DateInputField
        label="Start Date *"
        value={watchStartDate}
        onChange={setWatchStartDate}
        required
      />
      <View style={{ height: 10 }} />

      <TimeInputField
        label="Start Time (24h) *"
        value={startTime}
        onChange={setStartTime}
      />
      <View style={{ height: 10 }} />

      <DateInputField
        label="End Date *"
        value={watchEndDate}
        onChange={setWatchEndDate}
        required
      />
      <View style={{ height: 10 }} />

      <TimeInputField
        label="End Time (24h) *"
        value={endTime}
        onChange={setEndTime}
      />

      <Text style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>
        If the duty crosses midnight, select the next date as End Date.
      </Text>

      {/* -------- Summary + Remarks -------- */}
      <TextInput
        mode="outlined"
        label="Summary (required)"
        placeholder="Short, factual duty summary for TRB audit"
        value={summary}
        onChangeText={setSummary}
        multiline
        style={{ marginTop: 14 }}
      />

      <TextInput
        mode="outlined"
        label="Remarks (optional)"
        value={remarks}
        onChangeText={setRemarks}
        multiline
        style={{ marginTop: 10 }}
      />
    </Card.Content>
  </Card>
)}






        {/* ================= STATUS TAB ================= */}
        {activeTab === "STATUS" && (
          <>
            {/* DAILY SUMMARY */}
            {selectedDayTotals && (
              <Card style={[styles.card, styles.dashboardCard]}>
                <Card.Content>
                  <Text variant="titleMedium">Daily Watch Summary</Text>
                  <Text>
                    {formatMinutesToHoursMinutes(
                      selectedDayTotals.totalMinutes
                    )}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* WEEKLY SUMMARY */}
            {weeklyWatchTotals && (
              <Card style={[styles.card, styles.dashboardCard]}>
                <Card.Content>
                  <Text variant="titleMedium">Weekly Watch Summary</Text>
                  <Text>
                    {formatMinutesToHoursMinutes(
                      weeklyWatchTotals.totalMinutes
                    )}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* STCW */}
            {stcwCompliance && (
              <Card style={[styles.card, styles.dashboardCard]}>
                <Card.Content>
                  <Text variant="titleMedium">
                    STCW Compliance Status
                  </Text>
                  <Text>
                    24h:{" "}
                    {stcwCompliance.rest24h.compliant ? "OK" : "NOT OK"}
                  </Text>
                  <Text>
                    7d:{" "}
                    {stcwCompliance.rest7d.compliant ? "OK" : "NOT OK"}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}


        {/* ================= SEA WATCH TAB =================
           Sea Watch includes BRIDGE + ENGINE (existing).
           For Phase D2.1, we keep your existing Log Type chips so nothing breaks.
           Later (D2.2) we will improve Sea Watch UX with radio selection Bridge vs Engine.
        ==================================================== */}
        {activeTab === "SEA_WATCH" && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Sea Watch</Text>
              <Text style={{ marginTop: 8, opacity: 0.7 }}>
                Bridge and Engine Watchkeeping UI will appear here.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* ================= PORT WATCH TAB (placeholder) ================= */}
        {activeTab === "PORT_WATCH" && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Port Watch</Text>
              <Text style={{ marginTop: 8, opacity: 0.75 }}>
                Port Watch logging (Cargo / Anchor / Security / Bunkering) will be enabled in the next step.
              </Text>
            </Card.Content>
          </Card>
        )}


        {/* ================= HISTORY TAB ================= */}
        {activeTab === "HISTORY" && (
        <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
            Previous Logs
            </Text>

            {entries.map((e) => (
            <Card
                key={e.id}
                style={[
                styles.logCard,
                {
                    backgroundColor:
                    (theme as any)?.colors?.elevation?.level1 ??
                    theme.colors.surface,
                },
                ]}
            >
                <Card.Content>
                {/* Header Row */}
                <View style={styles.logHeader}>
                    <View>
                    <Text
                        variant="titleSmall"
                        style={{ fontWeight: "700", color: theme.colors.onSurface }}
                    >
                        {LOG_TYPE_LABEL[e.type]}
                    </Text>

                    <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                    >
                        {e.date.toDateString()}
                    </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.iconRow}>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        onPress={() => handleEdit(e)}
                        accessibilityLabel="Edit log"
                    />

                    <IconButton
                        icon="trash-can-outline"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => confirmDelete(e.id)}
                        accessibilityLabel="Delete log"
                    />
                    </View>
                </View>

                {/* Time Range */}
                {e.startTime && e.endTime && (
                    <Text
                    variant="bodySmall"
                    style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}
                    >
                    {`${e.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} – ${e.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                    </Text>
                )}

                {(() => {
                    const durationMinutes = calculateDurationMinutes(e.startTime, e.endTime);
                    if (!durationMinutes) return null;

                    return (
                        <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                        >
                        Duration: {formatMinutesToHoursMinutes(durationMinutes)}
                        </Text>
                    );
                    })()}


                {/* Summary */}
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.colors.onSurface,
                    lineHeight: 20,
                  }}
                >
                  {e.summary}
                </Text>

                {/* ENGINE SUMMARY (read-only) */}
                {e.type === "ENGINE" && (
                  (() => {
                    const engineSummary = buildEngineSummaryText(e.machineryMonitored);
                    if (!engineSummary) return null;

                    return (
                      <Text
                        variant="bodySmall"
                        style={{
                          marginTop: 6,
                          color: theme.colors.onSurfaceVariant,
                          fontStyle: "italic",
                        }}
                      >
                        {engineSummary}
                      </Text>
                    );
                  })()
                )}

                </Card.Content>
            </Card>
            ))}
        </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  /* =======================
     LAYOUT
     ======================= */
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },

  logCard: {
    marginBottom: 12,
  },

  /* =======================
     FORM STYLES
     (required by JSX)
     ======================= */
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  chip: {
    backgroundColor: OCEAN_GREEN,
    borderRadius: 20,
  },

  chipText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },

  timeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  input: {
    marginTop: 12,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },

  /* =======================
     DASHBOARD
     ======================= */
  dashboardCard: {
    marginTop: 12,
    borderRadius: 14,
  },

  dashboardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  dashboardDivider: {
    height: 1,
    opacity: 0.5,
    marginBottom: 12,
  },

  dashboardTotalBlock: {
    marginBottom: 10,
  },

  dashboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },

  /* =======================
     TAB BAR
     ======================= */
  tabBar: {
    flexDirection: "row",
    marginVertical: 16,
  },

  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
  },
    /* =======================
     HISTORY LOG STYLES (D7.3.2)
     Restores edit/delete layout
     ======================= */

  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /* ============================================================
     PHASE D7.3.3 — LOG FORM UX HELPERS
     These styles are layout-only and theme-safe.
     No hard-coded colors here.
     ============================================================ */

  formSection: {
    marginBottom: 20,
  },

  sectionHeader: {
    fontWeight: "700",
    marginBottom: 4,
  },

  helperText: {
    marginBottom: 8,
    lineHeight: 18,
  },

  formHint: {
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 18,
  },

  inlineValidationText: {
    marginTop: 4,
    fontSize: 12,
  },

  bridgeSectionCard: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  accordionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  segmentedTabs: {
  marginBottom: 16,
},
/* ============================================================
   Capsule / Pill Segmented Control
   ============================================================ */
capsuleContainer: {
  flexDirection: "row",
  borderRadius: 999,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#3194A0", // Ocean Green (brand)
},

capsuleSegment: {
  flex: 1,
  paddingVertical: 12,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "transparent",
},

capsuleLeft: {
  borderTopLeftRadius: 999,
  borderBottomLeftRadius: 999,
},

capsuleRight: {
  borderTopRightRadius: 999,
  borderBottomRightRadius: 999,
},

capsuleActive: {
  backgroundColor: "#3194A0",
},

capsuleText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#3194A0",
},

capsuleTextActive: {
  color: "#FFFFFF",
},

capsuleDisabled: {
  backgroundColor: "#E0E0E0",
},

capsuleTextDisabled: {
  fontSize: 14,
  fontWeight: "600",
  color: "#888888",
},

fieldLabel: {
  fontSize: 13,
  fontWeight: "600",
  marginBottom: 6,
  color: "#374151",
},



});
