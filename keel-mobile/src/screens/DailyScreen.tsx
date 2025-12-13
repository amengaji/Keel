//keel-mobile/src/screens/DailyScreen.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  IconButton,
  Checkbox,
  useTheme,
} from "react-native-paper";
import Toast from "react-native-toast-message";

import DateInputField from "../components/inputs/DateInputField";
import TimeInputField from "../components/inputs/TimeInputField";
import LatLongInput from "../components/inputs/LatLongInput";
import {
  getAllDailyLogs,
  insertDailyLog,
  updateDailyLog,
  deleteDailyLogById,
} from "../db/dailyLogs";
import { calculateDailyWatchTotals } from "../utils/watchAggregation";
import { calculateWeeklyWatchTotals } from "../utils/watchWeeklyAggregation";
import { checkStcwCompliance } from "../utils/stcwCompliance";

/* ============================================================
   TYPES
   ============================================================ */

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
  lookoutRole?: string | null;
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

    /* ---------------- DATA ---------------- */

  const [entries, setEntries] = useState<DailyLogEntry[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

    /* =======================
     TAB STATE (PHASE D7)
     Controls which major mode the screen is in.
     ======================= */

  type DailyTab = "LOG" | "STATUS" | "HISTORY";
  const [activeTab, setActiveTab] = useState<DailyTab>("LOG");


  /* =======================
     HELPERS
     ======================= */

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

  /* =======================
     LOAD FROM DB
     ======================= */

  useEffect(() => {
    const logs = getAllDailyLogs();
    setEntries(
      logs.map((l) => ({
        id: l.id,
        date: new Date(l.date),
        type: l.type,
        startTime: l.startTime ? new Date(l.startTime) : undefined,
        endTime: l.endTime ? new Date(l.endTime) : undefined,
        summary: l.summary,
        remarks: l.remarks ?? undefined,

        latDeg: l.latDeg ?? null,
        latMin: l.latMin ?? null,
        latDir: l.latDir ?? null,
        lonDeg: l.lonDeg ?? null,
        lonMin: l.lonMin ?? null,
        lonDir: l.lonDir ?? null,

        courseDeg: l.courseDeg ?? null,
        speedKn: l.speedKn ?? null,
        weather: l.weather ?? null,
        steeringMinutes: l.steeringMinutes ?? null,
        lookoutRole: l.lookoutRole ?? null,
      }))
    );
  }, []);

  /* =======================
     FORM STATE
     ======================= */

  const [logType, setLogType] = useState<LogType>("DAILY");
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
  const [lookoutRole, setLookoutRole] = useState("");


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
      setLookoutRole("");
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

  // Reset Bridge validity safely
  setIsLatValid(true);
  setIsLonValid(true);
  setIsCourseValid(true);
};


  /* =======================
     CRUD
     ======================= */

  const handleSave = () => {
    if (!isFormValid) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
      lookoutRole: lookoutRole || null,
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
        lookoutRole,
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
        lookoutRole,
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
  };

    /**
     * handleEdit
     * ----------
     * Loads an existing log entry into the LOG form.
     * Also shows a diagnostic toast so we can confirm what data is received.
     */
    const handleEdit = (entry: DailyLogEntry) => {
    // 1️⃣ Switch to LOG tab
    setActiveTab("LOG");

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
        setLookoutRole((entry.lookoutRole as any) ?? "");

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
        setLookoutRole("");

        setIsLatValid(true);
        setIsLonValid(true);
        setIsCourseValid(true);
    }

    // 5️⃣ Engine UI state (restore or reset)
    if (entry.type === "ENGINE") {
        // Keep engine UI visible when editing Engine logs
        setEngineRunning(true);
    } else {
        setEngineRunning(false);
        setManoeuvring(false);
        setEngineWatchType(null);
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
      lookoutRole: lookoutRole || null,
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

        {/* ---------------- TAB BAR ---------------- */}
        <View style={styles.tabBar}>
          {[
            { key: "LOG", label: "Log Watch" },
            { key: "STATUS", label: "My Status" },
            { key: "HISTORY", label: "History" },
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? "contained" : "text"}
              onPress={() => setActiveTab(tab.key as DailyTab)}
              style={styles.tabButton}
            >
              {tab.label}
            </Button>
          ))}
        </View>

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

        {/* ================= LOG TAB ================= */}
        {activeTab === "LOG" && (
          <Card style={styles.card}>
            <Card.Content>
              {/* ============================================================
                PHASE D7.3.3 — LOG WATCH FORM UX CLEANUP
                Goal: Make the form easier to understand for cadets.
                - No DB / logic changes
                - Only visual grouping + helper guidance
                - Light/Dark mode supported (colors pulled from theme)
                ============================================================ */}

              {/* ---------------- SECTION: LOG TYPE ---------------- */}
              <View style={styles.formSection}>
                <Text
                  variant="titleSmall"
                  style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                >
                  Log Type
                </Text>

                <Text
                  variant="bodySmall"
                  style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Select what you are logging. Bridge/Engine watches require time range.
                </Text>

                <View style={styles.filterRow}>
                  {(Object.keys(LOG_TYPE_LABEL) as LogType[]).map((t) => {
                    const isSelected = logType === t;

                    // Theme-safe chip colors (works in both light/dark mode)
                    const chipBackground = isSelected
                      ? theme.colors.primary
                      : (theme as any)?.colors?.elevation?.level1 ?? theme.colors.surface;

                    const chipTextColor = isSelected
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface;

                    return (
                      <Chip
                        key={t}
                        selected={isSelected}
                        onPress={() => setLogType(t)}
                        style={[styles.chip, { backgroundColor: chipBackground }]}
                        textStyle={[styles.chipText, { color: chipTextColor }]}
                      >
                        {LOG_TYPE_LABEL[t]}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* ---------------- SECTION: DATE ---------------- */}
              <View style={styles.formSection}>
                <Text
                  variant="titleSmall"
                  style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                >
                  Date
                </Text>

                <Text
                  variant="bodySmall"
                  style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Log date (defaults to today). Use the calendar icon if needed.
                </Text>

                <DateInputField label="Date" value={date} onChange={setDate} required />
              </View>

              {/* ---------------- SECTION: TIME & WATCH (only for BRIDGE/ENGINE) ---------------- */}
              {isTimeRequired && (
                <View style={styles.formSection}>
                  <Text
                    variant="titleSmall"
                    style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                  >
                    Time & Watch
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Start and End time are required for Bridge/Engine watch logs.
                  </Text>

                  <View style={styles.timeRow}>
                    <TimeInputField
                      label="Start Time"
                      value={startTime}
                      onChange={setStartTime}
                      required
                    />
                    <View style={{ width: 12 }} />
                    <TimeInputField
                      label="End Time"
                      value={endTime}
                      onChange={setEndTime}
                      required
                    />
                  </View>
                </View>
              )}

            {/* ---------------- SECTION: ENGINE WATCH OVERVIEW ---------------- */}
            {logType === "ENGINE" && (
              <View style={styles.formSection}>
                <Text
                  variant="titleSmall"
                  style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                >
                  Engine Watch Overview
                </Text>

                <Text
                  variant="bodySmall"
                  style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Basic engine room watch context. Use toggles instead of typing wherever
                  possible.
                </Text>

                {/* --- Watch Type --- */}
                <Text
                  variant="labelMedium"
                  style={{ marginTop: 8, color: theme.colors.onSurface }}
                >
                  Watch Type
                </Text>

                <View style={styles.filterRow}>
                  {[
                    { key: "UMS", label: "UMS" },
                    { key: "MANNED", label: "Manned" },
                    { key: "STANDBY", label: "Standby" },
                  ].map((opt) => {
                    const selected = engineWatchType === opt.key;

                    return (
                      <Chip
                        key={opt.key}
                        selected={selected}
                        onPress={() =>
                          setEngineWatchType(opt.key as typeof engineWatchType)
                        }
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? theme.colors.primary
                              : (theme as any)?.colors?.elevation?.level1 ??
                                theme.colors.surface,
                          },
                        ]}
                        textStyle={{
                          color: selected
                            ? theme.colors.onPrimary
                            : theme.colors.onSurface,
                        }}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>

                {/* --- Engine Running Toggle --- */}
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: theme.colors.onSurface }}>
                    Engine Running
                  </Text>

                  <IconButton
                    icon={engineRunning ? "toggle-switch" : "toggle-switch-off-outline"}
                    iconColor={
                      engineRunning ? theme.colors.primary : theme.colors.onSurfaceVariant
                    }
                    size={32}
                    onPress={() => setEngineRunning((p) => !p)}
                    accessibilityLabel="Toggle engine running"
                  />
                </View>

                {/* --- Manoeuvring Toggle --- */}
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: theme.colors.onSurface }}>
                    Manoeuvring
                  </Text>

                  <IconButton
                    icon={manoeuvring ? "toggle-switch" : "toggle-switch-off-outline"}
                    iconColor={
                      manoeuvring ? theme.colors.primary : theme.colors.onSurfaceVariant
                    }
                    size={32}
                    onPress={() => setManoeuvring((p) => !p)}
                    accessibilityLabel="Toggle manoeuvring"
                  />
                </View>

                {/* --- Attendance --- */}
                <Text
                  variant="labelMedium"
                  style={{ marginTop: 12, color: theme.colors.onSurface }}
                >
                  Engine Room Attendance
                </Text>

                <View style={styles.filterRow}>
                  {[
                    { key: "SOLO", label: "Solo" },
                    { key: "WITH_SENIOR", label: "With Senior" },
                    { key: "TEAM", label: "Team" },
                  ].map((opt) => {
                    const selected = engineRoomAttendance === opt.key;

                    return (
                      <Chip
                        key={opt.key}
                        selected={selected}
                        onPress={() =>
                          setEngineRoomAttendance(
                            opt.key as typeof engineRoomAttendance
                          )
                        }
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? theme.colors.primary
                              : (theme as any)?.colors?.elevation?.level1 ??
                                theme.colors.surface,
                          },
                        ]}
                        textStyle={{
                          color: selected
                            ? theme.colors.onPrimary
                            : theme.colors.onSurface,
                        }}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ---------------- SECTION: MACHINERY STATUS (ENGINE RUNNING ONLY) ---------------- */}
            {logType === "ENGINE" && engineRunning && (
              <View
                style={[
                  styles.bridgeSectionCard,
                  {
                    backgroundColor:
                      (theme as any)?.colors?.elevation?.level1 ??
                      theme.colors.surface,
                    borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                  },
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                >
                  Machinery Status
                </Text>

                <Text
                  variant="bodySmall"
                  style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Select machinery in operation during this watch.
                </Text>

                {/* --- Main Engine --- */}
                <View style={styles.checkRow}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    Main Engine Running
                  </Text>

                  <Checkbox
                    status={mainEngineRunning ? "checked" : "unchecked"}
                    onPress={() => setMainEngineRunning((p) => !p)}
                  />
                </View>

                {/* --- Generators --- */}
                <Text
                  variant="labelMedium"
                  style={{ marginTop: 8, color: theme.colors.onSurface }}
                >
                  Generators Running
                </Text>

                {(["DG1", "DG2", "DG3"] as const).map((dg) => (
                  <View key={dg} style={styles.checkRow}>
                    <Text style={{ color: theme.colors.onSurface }}>{dg}</Text>

                    <Checkbox
                      status={generatorsRunning[dg] ? "checked" : "unchecked"}
                      onPress={() =>
                        setGeneratorsRunning((p) => ({
                          ...p,
                          [dg]: !p[dg],
                        }))
                      }
                    />
                  </View>
                ))}

                {/* --- Boiler --- */}
                <View style={styles.checkRow}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    Boiler in Service
                  </Text>

                  <Checkbox
                    status={boilerInService ? "checked" : "unchecked"}
                    onPress={() => setBoilerInService((p) => !p)}
                  />
                </View>

                {/* --- Steering Gear --- */}
                <View style={styles.checkRow}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    Steering Gear in Use
                  </Text>

                  <Checkbox
                    status={steeringGearInUse ? "checked" : "unchecked"}
                    onPress={() => setSteeringGearInUse((p) => !p)}
                  />
                </View>
              </View>
            )}

{/* ---------------- SECTION: ENGINE PARAMETERS (ACCORDION, OPTIONAL) ---------------- */}
{logType === "ENGINE" && engineRunning && (
  <View
    style={[
      styles.bridgeSectionCard,
      {
        backgroundColor:
          (theme as any)?.colors?.elevation?.level1 ?? theme.colors.surface,
        borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
      },
    ]}
  >
    {/* Accordion Header */}
    <View style={styles.accordionHeaderRow}>
      <View>
        <Text
          variant="titleSmall"
          style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
        >
          Engine Parameters (Optional)
        </Text>

        <Text
          variant="bodySmall"
          style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
        >
          Add quick operational parameters without typing.
        </Text>
      </View>

      <IconButton
        icon={engineLoadPercent != null || engineRpmRange || fuelType
          ? "chevron-up"
          : "chevron-down"}
        onPress={() => {
          // Helper behavior:
          // If any parameter is set, we treat the accordion as “open” visually by showing the up icon.
          // If nothing is set, we show down icon. This avoids adding extra state variable.
          //
          // Tapping the icon toggles between:
          // - Clearing values (collapse)
          // - Setting a default “open” value placeholder (expand)
          //
          // NOTE: This is UI-only; you can adjust later if you want a dedicated open/close state.
          const isOpen = engineLoadPercent != null || engineRpmRange || fuelType;
          if (isOpen) {
            setEngineLoadPercent(null);
            setEngineRpmRange(null);
            setFuelType(null);
            setGeneratorsLoadBalanced(true);
          } else {
            // Opening: set a safe default slider midpoint so the controls appear
            setEngineLoadPercent(50);
          }
        }}
      />
    </View>

    {/* Accordion Content:
       We show content when any value is present (including default 50 on open). */}
    {(engineLoadPercent != null || engineRpmRange || fuelType) && (
      <>
        {/* --- Load Percent (Slider substitute: tap-based quick chips) --- */}
        <Text
          variant="labelMedium"
          style={{ marginTop: 6, color: theme.colors.onSurface }}
        >
          Main Engine Load
        </Text>

        <View style={styles.filterRow}>
          {[
            { label: "Low (0–30%)", value: 20 },
            { label: "Med (31–70%)", value: 50 },
            { label: "High (71–100%)", value: 85 },
          ].map((opt) => {
            const selected = engineLoadPercent === opt.value;

            return (
              <Chip
                key={opt.label}
                selected={selected}
                onPress={() => setEngineLoadPercent(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : (theme as any)?.colors?.elevation?.level1 ??
                        theme.colors.surface,
                  },
                ]}
                textStyle={{
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                }}
              >
                {opt.label}
              </Chip>
            );
          })}
        </View>

        {/* --- RPM Range --- */}
        <Text
          variant="labelMedium"
          style={{ marginTop: 4, color: theme.colors.onSurface }}
        >
          RPM Range
        </Text>

        <View style={styles.filterRow}>
          {[
            { key: "LOW", label: "Low" },
            { key: "MEDIUM", label: "Medium" },
            { key: "HIGH", label: "High" },
          ].map((opt) => {
            const selected = engineRpmRange === opt.key;

            return (
              <Chip
                key={opt.key}
                selected={selected}
                onPress={() => setEngineRpmRange(opt.key as any)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : (theme as any)?.colors?.elevation?.level1 ??
                        theme.colors.surface,
                  },
                ]}
                textStyle={{
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                }}
              >
                {opt.label}
              </Chip>
            );
          })}
        </View>

        {/* --- Fuel Type --- */}
        <Text
          variant="labelMedium"
          style={{ marginTop: 4, color: theme.colors.onSurface }}
        >
          Fuel Type
        </Text>

        <View style={styles.filterRow}>
          {[
            { key: "HFO", label: "HFO" },
            { key: "MGO", label: "MGO" },
            { key: "LSFO", label: "LSFO" },
            { key: "OTHER", label: "Other" },
          ].map((opt) => {
            const selected = fuelType === opt.key;

            return (
              <Chip
                key={opt.key}
                selected={selected}
                onPress={() => setFuelType(opt.key as any)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : (theme as any)?.colors?.elevation?.level1 ??
                        theme.colors.surface,
                  },
                ]}
                textStyle={{
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                }}
              >
                {opt.label}
              </Chip>
            );
          })}
        </View>

        {/* --- Generator Load Balanced --- */}
        <View style={[styles.checkRow, { marginTop: 6 }]}>
          <Text style={{ color: theme.colors.onSurface }}>
            Generators Load Balanced
          </Text>

          <Checkbox
            status={generatorsLoadBalanced ? "checked" : "unchecked"}
            onPress={() => setGeneratorsLoadBalanced((p) => !p)}
          />
        </View>
      </>
    )}
  </View>
)}


              {/* ---------------- SECTION: BRIDGE NAVIGATION (only for BRIDGE) ---------------- */}
              {logType === "BRIDGE" && (
                <View
                  style={[
                    styles.bridgeSectionCard,
                    {
                      // Theme-safe card background
                      backgroundColor:
                        (theme as any)?.colors?.elevation?.level1 ?? theme.colors.surface,
                      borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                    },
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                  >
                    Position & Navigation (Bridge Watch)
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Latitude, Longitude, and Course are mandatory for Bridge watch entries.
                  </Text>

                  <LatLongInput
                    key={`lat-${editingLogId ?? "new"}`}
                    label="Latitude"
                    type="LAT"
                    degrees={latDeg}
                    minutes={latMin}
                    direction={latDir}
                    onChange={(v) => {
                      // Step 1: Store parsed values
                      setLatDeg(v.degrees);
                      setLatMin(v.minutes);
                      setLatDir(v.direction as any);

                      // Step 2: Store validity for form validation
                      setIsLatValid(v.isValid);
                    }}
                  />

                  <LatLongInput
                    key={`lon-${editingLogId ?? "new"}`}
                    label="Longitude"
                    type="LON"
                    degrees={lonDeg}
                    minutes={lonMin}
                    direction={lonDir}
                    onChange={(v) => {
                      // Step 1: Store parsed values
                      setLonDeg(v.degrees);
                      setLonMin(v.minutes);
                      setLonDir(v.direction as any);

                      // Step 2: Store validity for form validation
                      setIsLonValid(v.isValid);
                    }}
                  />

                  <TextInput
                    label="Course (°T)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={courseDeg?.toString() ?? ""}
                    onChangeText={(t) => {
                      // Convert text to number (or null if empty/invalid)
                      const v = Number(t);
                      const next = Number.isNaN(v) ? null : v;

                      setCourseDeg(next);

                      // Valid course range: 0–359 degrees
                      if (next == null) {
                        setIsCourseValid(true);
                      } else {
                        setIsCourseValid(next >= 0 && next <= 359);
                      }
                    }}
                    error={!isCourseValid}
                    style={styles.input}
                  />

                  <Text
                    variant="bodySmall"
                    style={[
                      styles.inlineValidationText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Valid range: 0–359
                  </Text>

                  <TextInput
                    label="Speed (knots)"
                    mode="outlined"
                    keyboardType="decimal-pad"
                    value={speedKn?.toString() ?? ""}
                    onChangeText={(t) => setSpeedKn(t === "" ? null : Number(t))}
                    style={styles.input}
                  />

                  <TextInput
                    label="Steering Time (minutes)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={steeringMinutes?.toString() ?? ""}
                    onChangeText={(t) => setSteeringMinutes(t === "" ? null : Number(t))}
                    style={styles.input}
                  />

                  <TextInput
                    label="Weather / Visibility"
                    mode="outlined"
                    value={weather}
                    onChangeText={setWeather}
                    style={styles.input}
                  />

                  <TextInput
                    label="Lookout Role"
                    mode="outlined"
                    value={lookoutRole}
                    onChangeText={setLookoutRole}
                    style={styles.input}
                  />
                </View>
              )}

              {/* ---------------- SECTION: ACTIVITY DETAILS ---------------- */}
              <View style={styles.formSection}>
                <Text
                  variant="titleSmall"
                  style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
                >
                  Activity Details
                </Text>

                <Text
                  variant="bodySmall"
                  style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Summary is mandatory. Use Remarks for extra notes if needed.
                </Text>

                <TextInput
                  label="Activity Summary"
                  mode="outlined"
                  value={summary}
                  onChangeText={setSummary}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Remarks (optional)"
                  mode="outlined"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />

                {/* Inline “why Save is disabled” guidance (no alerts, no popups) */}
                {!isFormValid && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.formHint,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    To enable Save, please complete the following:
                    {!date && "\n• Select a Date"}
                    {summary.trim().length === 0 && "\n• Enter Activity Summary"}
                    {isTimeRequired && (!startTime || !endTime) && "\n• Enter Start and End Time"}
                    {logType === "BRIDGE" && !isLatValid && "\n• Enter valid Latitude"}
                    {logType === "BRIDGE" && !isLonValid && "\n• Enter valid Longitude"}
                    {logType === "BRIDGE" && !isCourseValid && "\n• Enter valid Course (0–359)"}

                  </Text>
                )}
              </View>

              {/* ---------------- SECTION: ACTIONS ---------------- */}
              <View style={styles.actions}>
                {editingLogId && <Button onPress={resetForm}>Cancel</Button>}

                <Button
                  mode="contained"
                  onPress={editingLogId ? handleUpdate : handleSave}
                  disabled={!isFormValid}
                >
                  {editingLogId ? "Update Entry" : "Save Entry"}
                </Button>
              </View>
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
                    {`${e.startTime.toLocaleTimeString()} – ${e.endTime.toLocaleTimeString()}`}
                    </Text>
                )}

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

});
