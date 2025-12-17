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
 * PORT_WATCH  → cargo / anchor / gangway / bunkering (coming next)
 * STATUS      → compliance / summaries (unchanged)
 * HISTORY     → past entries (unchanged)
 */
type DailyTab =
  | "DAILY_WORK"
  | "SEA_WATCH"
  | "PORT_WATCH"
  | "STATUS"
  | "HISTORY";

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
type LogType = "DAILY" | "BRIDGE" | "ENGINE";


type DailyLogEntry = {
  id: string;
  date: Date;
  type: LogType;
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
};

const OCEAN_GREEN = "#3194A0";

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
   * PORT_WATCH → cargo / anchor / gangway / bunkering (next step)
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

  /**
 * ============================================================
 * Port Watch Sub-Type
 * ============================================================
 * Cargo / Anchor / Gangway / Bunkering
 */
type PortWatchType =
  | "CARGO"
  | "ANCHOR"
  | "GANGWAY"
  | "BUNKERING";

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

  // PORT_WATCH intentionally not mapped yet
}, [dutyMode, seaWatchMode]);



  const [date, setDate] = useState<Date | null>(today);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [summary, setSummary] = useState("");
  const [remarks, setRemarks] = useState("");

  const [latDeg, setLatDeg] = useState<number | null>(null);
  const [latMin, setLatMin] = useState<number | null>(null);
  const [latDir, setLatDir] = useState<"N" | "S">("N");
  const [isLatValid, setIsLatValid] = useState(false);

  const [lonDeg, setLonDeg] = useState<number | null>(null);
  const [lonMin, setLonMin] = useState<number | null>(null);
  const [lonDir, setLonDir] = useState<"E" | "W">("E");
  const [isLonValid, setIsLonValid] = useState(false);

  const [courseDeg, setCourseDeg] = useState<number | null>(null);
  const [isCourseValid, setIsCourseValid] = useState(true);

  const [speedKn, setSpeedKn] = useState<number | null>(null);
  const [steeringMinutes, setSteeringMinutes] = useState<number | null>(null);
  const [weather, setWeather] = useState("");
  const [isLookout, setIsLookout] = useState<boolean>(false);


    /* ============================================================
     ENGINE WATCH STATE (PHASE D7.3.4)
     These states are UI-only for now.
     No DB persistence in this phase.
     ============================================================ */

  // --- Engine Watch Overview ---
  const [engineWatchType, setEngineWatchType] = useState<
    "UMS" | "MANNED" | "STANDBY" | null
  >(null);

  const [engineRunning, setEngineRunning] = useState<boolean>(false);
  const [manoeuvring, setManoeuvring] = useState<boolean>(false);

  const [engineRoomAttendance, setEngineRoomAttendance] = useState<
    "SOLO" | "WITH_SENIOR" | "TEAM" | null
  >(null);

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

  const isFormValid =
    !!date &&
    summary.trim().length > 0 &&
    (!isTimeRequired || (startTime && endTime)) &&
    (logType !== "BRIDGE" || (isLatValid && isLonValid && isCourseValid));

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

      setCourseDeg(null);
      setIsCourseValid(true);
      setSpeedKn(null);
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

  setCourseDeg(null);
  setIsCourseValid(true);

  setSpeedKn(null);
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
    const payload = {
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
      generatorsLoadBalanced,

      // Abnormalities / rounds
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

  const handleSave = () => {

    const overlapping = findOverlappingEntry(entries, {
  date: date!,
  startTime,
  endTime,
});

if (overlapping) {
  Toast.show({
    type: "error",
    text1: "Time overlap detected",
    text2: overlapping.startTime && overlapping.endTime
      ? `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} (${overlapping.startTime
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}–${overlapping.endTime
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })})`
      : `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} entry`,
    position: "bottom",
  });
  return;
}

    if (!isFormValid) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const machineryMonitored = logType === "ENGINE" ? buildEngineMachineryPayloadJson() : null;


    insertDailyLog({
      id,
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
      courseDeg,
      speedKn,
      weather: weather || null,
      steeringMinutes,
      isLookout,
      machineryMonitored,
    });

        /**
     * STCW PREVIEW CALCULATION (CRITICAL)
     * ----------------------------------
     * We create a temporary preview list that includes
     * the log being saved, because `entries` has not
     * updated yet at this point.
     */

    const previewEntries = [
      {
        id,
        date: date!,
        type: logType,
        startTime: startTime ?? undefined,
        endTime: endTime ?? undefined,
        summary,
        remarks,
        latDeg,
        latMin,
        latDir,
        lonDeg,
        lonMin,
        lonDir,
        courseDeg,
        speedKn,
        weather,
        steeringMinutes,
        isLookout,
      },
      ...entries,
    ];

    const previewStcwCompliance = checkStcwCompliance(
      previewEntries,
      date!
    );

    setEntries((p) => [
      {
        id,
        date: date!,
        type: logType,
        startTime: startTime ?? undefined,
        endTime: endTime ?? undefined,
        summary,
        remarks,
        latDeg,
        latMin,
        latDir,
        lonDeg,
        lonMin,
        lonDir,
        courseDeg,
        speedKn,
        weather,
        steeringMinutes,
        isLookout,
      },
      ...p,
    ]);
        // Success feedback (non-blocking, mobile UX standard)
    Toast.show({
      type: "success",
      text1: "Log entry saved",
      text2: "Your watch entry has been recorded successfully.",
      position: "bottom",
    });
        /**
     * Advisory toasts
     * ----------------
     * These are delayed intentionally to avoid overlap.
     * This guarantees clear visibility on all mobile devices.
     */

    // ENGINE-specific advisories
    if (logType === "ENGINE") {
      // Engine running OFF → machinery skipped
      if (!engineRunning) {
        setTimeout(() => {
          Toast.show({
            type: "info",
            text1: "Engine not running",
            text2: "Machinery status was skipped for this watch.",
            position: "bottom",
          });
        }, 500);
      }

      // Engine parameters provided (optional)
      if (engineLoadPercent != null || engineRpmRange || fuelType) {
        setTimeout(() => {
          Toast.show({
            type: "info",
            text1: "Engine parameters recorded",
            text2: "Optional engine parameters were saved.",
            position: "bottom",
          });
        }, 1000);
      }
    }

    // BRIDGE-specific advisory
    if (logType === "BRIDGE" && !weather) {
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "Weather not recorded",
          text2: "Weather / visibility was left blank.",
          position: "bottom",
        });
      }, 500);
    }
    /**
     * STCW ADVISORY TOASTS (NON-BLOCKING)
     * ---------------------------------
     * - Uses existing utilities only
     * - Informational / warning only
     * - Sequential delays to avoid overlap
     * - Never blocks Save
     */

    // --- STCW 24-hour rest advisory ---
    if (previewStcwCompliance && !previewStcwCompliance.rest24h.compliant) {
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "24-hour rest advisory",
          text2:
            "Rest in the last 24 hours may be below STCW guidance. Monitor upcoming watches.",
          position: "bottom",
        });
      }, 1500);
    }

    // --- STCW 7-day rest advisory ---
    if (stcwCompliance && !stcwCompliance.rest7d.compliant) {
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "7-day rest advisory",
          text2:
            "Weekly rest may be insufficient. Review watch distribution.",
          position: "bottom",
        });
      }, 2000);
    }

    // --- High daily watch load (awareness only) ---
    if (
      selectedDayTotals &&
      selectedDayTotals.totalMinutes >= 600 // ≥ 10 hours (advisory, not enforcement)
    ) {
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "High daily watch load",
          text2:
            "High total watch hours recorded for this day.",
          position: "bottom",
        });
      }, 2500);
    }

    // --- Weekly watch trend (awareness only) ---
    if (
      weeklyWatchTotals &&
      weeklyWatchTotals.totalMinutes >= 3600 // ≥ 60 hours (trend awareness)
    ) {
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: "Weekly watch trend",
          text2:
            "Watch hours are trending high this week.",
          position: "bottom",
        });
      }, 3000);
    }


    resetForm();
    refreshLogs();

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

        setCourseDeg(entry.courseDeg ?? null);
        setSpeedKn(entry.speedKn ?? null);
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
        setCourseDeg(null);
        setSpeedKn(null);
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

    const machineryMonitored = logType === "ENGINE" ? buildEngineMachineryPayloadJson() : null;

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
    text2: overlapping.startTime && overlapping.endTime
      ? `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} (${overlapping.startTime
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}–${overlapping.endTime
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })})`
      : `Conflicts with ${LOG_TYPE_LABEL[overlapping.type]} entry`,
    position: "bottom",
  });
  return;
}



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
      courseDeg,
      speedKn,
      weather: weather || null,
      steeringMinutes,
      isLookout,

      machineryMonitored,

    });

    setEntries((p) =>
      p.map((e) =>
        e.id === editingLogId ? { ...e, ...arguments[0] } : e
      )
    );
        // Success feedback for update
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
    DUTY TYPE SELECTION — CAPSULE SEGMENTED CONTROL
    - Mode selection (not a list)
    - Large touch targets
    - Maritime-friendly UX
   ============================================================ */}
{primaryMode === "LOG" && (
  <Card style={{ marginBottom: 16 }}>
    <Card.Content>
      <Text variant="titleMedium" style={{ marginBottom: 12 }}>
        Select Duty Type
      </Text>

      <View style={styles.capsuleContainer}>
        {/* Daily Work */}
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

        {/* Sea Watch */}
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

        {/* Port Watch */}
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
    PORT WATCH FORM — UI SKELETON (Phase D3.1)
    - Counts toward STCW (logic wired later)
    - Save wiring comes in next step
   ============================================================ */}
{primaryMode === "LOG" && dutyMode === "PORT_WATCH" && (
  <Card style={{ marginBottom: 16 }}>
    <Card.Content>
      <Text variant="titleMedium" style={{ marginBottom: 12 }}>
        Port Watch
      </Text>

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
          onPress={() => setPortWatchType("GANGWAY")}
          style={[
            styles.capsuleSegment,
            portWatchType === "GANGWAY" && styles.capsuleActive,
          ]}
        >
          <Text
            style={[
              styles.capsuleText,
              portWatchType === "GANGWAY" && styles.capsuleTextActive,
            ]}
          >
            Gangway
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

      {/* -------- Time Inputs (reuse existing components) -------- */}
      <View style={{ marginTop: 16 }}>
        <TimeInputField
          label="Start Time"
          value={startTime}
          onChange={setStartTime}
        />

        <TimeInputField
          label="End Time"
          value={endTime}
          onChange={setEndTime}
        />
      </View>

      {/* -------- Optional Remarks -------- */}
      <TextInput
        label="Remarks (optional)"
        value={remarks}
        onChangeText={setRemarks}
        mode="outlined"
        multiline
        style={{ marginTop: 16 }}
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
                Port Watch logging (Cargo / Anchor / Gangway / Bunkering) will be enabled in the next step.
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



});
