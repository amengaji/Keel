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

export default function DailyScreen() {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);

  const [entries, setEntries] = useState<DailyLogEntry[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

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

  /* =======================
     DAILY WATCH DASHBOARD (PHASE D4 — STEP 4.3)
     Placement: below title, above entry form (Option B)

     STEP C.2 (UI POLISH + DARK MODE FIXES) - DASHBOARD ONLY
     - We do NOT change any calculations.
     - We do NOT change validation.
     - We do NOT change DB logic.
     - We only improve how the dashboard is displayed and how it adapts in dark mode.
     ======================= */

  // Build daily totals whenever logs change (Bridge/Engine only).
  // This is used only for display here; STCW compliance checks come later.
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


  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [summary, setSummary] = useState("");
  const [remarks, setRemarks] = useState("");

  // Bridge navigation
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >

        <Text variant="headlineMedium">Diary & Watchkeeping</Text>

        {/* =======================
           DAILY WATCH SUMMARY (STEP C.2)
           UI polish + dark-mode safe colors (dashboard only)
           Notes for beginners:
           - We DO NOT change any calculations here.
           - We only display totals that were already computed above.
           ======================= */}
          <Card
            style={[
              styles.card,
              styles.dashboardCard,
              {
                // Dark-mode safe background (Paper theme controls this)
                backgroundColor:
                  (theme as any)?.colors?.elevation?.level1 ?? theme.colors.surface,
              },
            ]}
          >
            <Card.Content>
              <View style={styles.dashboardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleMedium"
                    style={[styles.dashboardTitle, { color: theme.colors.onSurface }]}
                  >
                    Daily Watch Summary
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {date ? date.toDateString() : ""}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View
                style={[
                  styles.dashboardDivider,
                  {
                    backgroundColor:
                      (theme as any)?.colors?.outlineVariant ?? theme.colors.outline,
                  },
                ]}
              />

              {selectedDayTotals ? (
                <>
                  {/* TOTAL (primary metric) */}
                  <View style={styles.dashboardTotalBlock}>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      TOTAL WATCH
                    </Text>
                    <Text
                      variant="headlineSmall"
                      style={[
                        styles.dashboardTotalValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {formatMinutesToHoursMinutes(selectedDayTotals.totalMinutes)}
                    </Text>
                  </View>

                  {/* Secondary metrics */}
                  <View style={styles.dashboardRow}>
                    <Text
                      style={[
                        styles.dashboardLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Bridge Watch
                    </Text>
                    <Text
                      style={[
                        styles.dashboardValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {formatMinutesToHoursMinutes(selectedDayTotals.bridgeMinutes)}
                    </Text>
                  </View>

                  <View style={styles.dashboardRow}>
                    <Text
                      style={[
                        styles.dashboardLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Engine Watch
                    </Text>
                    <Text
                      style={[
                        styles.dashboardValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {formatMinutesToHoursMinutes(selectedDayTotals.engineMinutes)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.dashboardEmptyText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  No watch logs recorded for this date yet.
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* =======================
      WEEKLY WATCH SUMMARY (STEP 4.4)
      Rolling 7-day window ending on selected date.
      - STCW-style (NOT calendar week)
      - Read-only dashboard
      ======================= */}
  {weeklyWatchTotals && (
    <Card style={[styles.card, styles.dashboardCard]}>
      <Card.Content>
        {/* Header */}
        <View style={{ marginBottom: 6 }}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            Weekly Watch Summary
          </Text>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {weeklyWatchTotals.startDateKey} →{" "}
            {weeklyWatchTotals.endDateKey}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.dashboardDivider,
            {
              backgroundColor:
                (theme as any)?.colors?.outlineVariant ??
                theme.colors.outline,
            },
          ]}
        />

        {/* Total */}
        <View style={styles.dashboardTotalBlock}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            TOTAL WATCH (LAST 7 DAYS)
          </Text>

          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.onSurface,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {formatMinutesToHoursMinutes(
              weeklyWatchTotals.totalMinutes
            )}
          </Text>
        </View>

        {/* Bridge */}
        <View style={styles.dashboardRow}>
          <Text
            style={[
              styles.dashboardLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Bridge Watch
          </Text>

          <Text
            style={[
              styles.dashboardValue,
              { color: theme.colors.onSurface },
            ]}
          >
            {formatMinutesToHoursMinutes(
              weeklyWatchTotals.bridgeMinutes
            )}
          </Text>
        </View>

        {/* Engine */}
        <View style={styles.dashboardRow}>
          <Text
            style={[
              styles.dashboardLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Engine Watch
          </Text>

          <Text
            style={[
              styles.dashboardValue,
              { color: theme.colors.onSurface },
            ]}
          >
            {formatMinutesToHoursMinutes(
              weeklyWatchTotals.engineMinutes
            )}
          </Text>
        </View>
      </Card.Content>
    </Card>
  )}


        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.filterRow}>
              {(Object.keys(LOG_TYPE_LABEL) as LogType[]).map((t) => (
                <Chip
                  key={t}
                  selected={logType === t}
                  onPress={() => setLogType(t)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {LOG_TYPE_LABEL[t]}
                </Chip>
              ))}
            </View>

            <DateInputField label="Date" value={date} onChange={setDate} required />

            {isTimeRequired && (
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
            )}

            {logType === "BRIDGE" && (
              <>
                <LatLongInput
                  label="Latitude"
                  type="LAT"
                  degrees={latDeg}
                  minutes={latMin}
                  direction={latDir}
                  onChange={(v) => {
                    setLatDeg(v.degrees);
                    setLatMin(v.minutes);
                    setLatDir(v.direction as any);
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
                    setLonDir(v.direction as any);
                    setIsLonValid(v.isValid);
                  }}
                />

                <TextInput
                  label="Course (°T)"
                  mode="outlined"
                  keyboardType="numeric"
                  value={courseDeg?.toString() ?? ""}
                  onChangeText={(t) => {
                    const v = Number(t);
                    setCourseDeg(Number.isNaN(v) ? null : v);
                    setIsCourseValid(v >= 0 && v <= 359);
                  }}
                  error={!isCourseValid}
                  style={styles.input}
                />

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
                  onChangeText={(t) =>
                    setSteeringMinutes(t === "" ? null : Number(t))
                  }
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
              </>
            )}

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

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Previous Logs
        </Text>

        {entries.map((e) => (
          <Card key={e.id} style={styles.logCard}>
            <Card.Content>
              <View style={styles.logHeader}>
                <Text variant="titleSmall">{LOG_TYPE_LABEL[e.type]}</Text>
                <View style={styles.iconRow}>
                  <IconButton icon="pencil" size={18} onPress={() => handleEdit(e)} />
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    iconColor={theme.colors.error}
                    onPress={() => confirmDelete(e.id)}
                  />
                </View>
              </View>

              <Text variant="bodySmall">{e.date.toDateString()}</Text>

              {e.startTime && e.endTime && (
                <Text variant="bodySmall">
                  {`${e.startTime.toLocaleTimeString()} – ${e.endTime.toLocaleTimeString()}`}
                </Text>
              )}

              <Text style={{ marginTop: 6 }}>{e.summary}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 20 },
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
  timeRow: { flexDirection: "row", marginBottom: 12 },
  input: { marginTop: 12 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  logCard: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
  },

  /* =======================
     DASHBOARD STYLES (STEP C.2)
     - Colors are NOT hard-coded here (we use theme colors inline in JSX)
     - These styles only control spacing/layout so they are safe in dark mode
     ======================= */
  dashboardCard: {
    marginTop: 12,
    borderRadius: 14,
  },
  dashboardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dashboardTitle: {
    fontWeight: "700",
  },
  dashboardDivider: {
    height: 1,
    opacity: 0.5,
    marginBottom: 12,
  },
  dashboardTotalBlock: {
    marginBottom: 10,
  },
  dashboardTotalValue: {
    marginTop: 4,
    fontWeight: "800",
  },
  dashboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  dashboardLabel: {
    fontSize: 14,
  },
  dashboardValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  dashboardEmptyText: {
    marginTop: 4,
    opacity: 0.9,
  },
});
