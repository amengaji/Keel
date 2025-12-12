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
  useTheme,
} from "react-native-paper";

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
  }, [logType]);

  /* =======================
     RESET
     ======================= */

  const resetForm = () => {
    setEditingLogId(null);
    setLogType("DAILY");
    setDate(today);
    setStartTime(null);
    setEndTime(null);
    setSummary("");
    setRemarks("");
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

    resetForm();
  };

  const handleEdit = (log: DailyLogEntry) => {
    setEditingLogId(log.id);
    setLogType(log.type);
    setDate(log.date);
    setStartTime(log.startTime ?? null);
    setEndTime(log.endTime ?? null);
    setSummary(log.summary);
    setRemarks(log.remarks ?? "");
    setLatDeg(log.latDeg ?? null);
    setLatMin(log.latMin ?? null);
    setLatDir(log.latDir ?? "N");
    setIsLatValid(log.latDeg != null && log.latMin != null);
    setLonDeg(log.lonDeg ?? null);
    setLonMin(log.lonMin ?? null);
    setLonDir(log.lonDir ?? "E");
    setIsLonValid(log.lonDeg != null && log.lonMin != null);
    setCourseDeg(log.courseDeg ?? null);
    setIsCourseValid(
      log.courseDeg == null || (log.courseDeg >= 0 && log.courseDeg <= 359)
    );
    setSpeedKn(log.speedKn ?? null);
    setSteeringMinutes(log.steeringMinutes ?? null);
    setWeather(log.weather ?? "");
    setLookoutRole(log.lookoutRole ?? "");
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
        To enable Save: select a Date, enter Activity Summary, and for Bridge/Engine
        logs enter Start/End time. Bridge logs also require valid Lat/Lon and Course.
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

// const styles = StyleSheet.create({
//   container: { padding: 16, paddingBottom: 40 },
//   card: { marginBottom: 20 },
//   filterRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 12,
//   },
//   chip: {
//     backgroundColor: OCEAN_GREEN,
//     borderRadius: 20,
//   },
//   chipText: {
//     color: "#FFFFFF",
//     fontWeight: "500",
//   },
//   timeRow: { flexDirection: "row", marginBottom: 12 },
//   input: { marginTop: 12 },
//   actions: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     gap: 12,
//     marginTop: 16,
//   },
//   sectionTitle: {
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   logCard: {
//     marginBottom: 12,
//   },
//   logHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   iconRow: {
//     flexDirection: "row",
//   },

//   /* =======================
//      DASHBOARD STYLES (STEP C.2)
//      - Colors are NOT hard-coded here (we use theme colors inline in JSX)
//      - These styles only control spacing/layout so they are safe in dark mode
//      ======================= */
//   dashboardCard: {
//     marginTop: 12,
//     borderRadius: 14,
//   },
//   dashboardHeaderRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   dashboardTitle: {
//     fontWeight: "700",
//   },
//   dashboardDivider: {
//     height: 1,
//     opacity: 0.5,
//     marginBottom: 12,
//   },
//   dashboardTotalBlock: {
//     marginBottom: 10,
//   },
//   dashboardTotalValue: {
//     marginTop: 4,
//     fontWeight: "800",
//   },
//   dashboardRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 6,
//   },
//   dashboardLabel: {
//     fontSize: 14,
//   },
//   dashboardValue: {
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   dashboardEmptyText: {
//     marginTop: 4,
//     opacity: 0.9,
//   },
//     /* =======================
//      TAB BAR STYLES (PHASE D7.1)
//      - Layout only
//      - Colors handled by Paper Button modes
//      ======================= */
//   tabBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 12,
//     marginBottom: 16,
//   },
//   tabButton: {
//     flex: 1,
//     marginHorizontal: 4,
//     borderRadius: 20,
//   },
//   tabButtonActive: {
//     // Visual emphasis only; theme handles colors
//   },

// });


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

});
