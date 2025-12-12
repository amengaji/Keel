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

type LogType = "DAILY" | "BRIDGE" | "ENGINE";
type DashboardFilter = "ALL" | LogType;

type DailyLogEntry = {
  id: string;
  date: Date;
  type: LogType;
  startTime?: Date;
  endTime?: Date;
  summary: string;
  remarks?: string;
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
  const [dashboardFilter, setDashboardFilter] =
    useState<DashboardFilter>("ALL");

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

  // Bridge navigation fields
  const [latDeg, setLatDeg] = useState<number | null>(null);
  const [latMin, setLatMin] = useState<number | null>(null);
  const [latDir, setLatDir] = useState<"N" | "S">("N");
  const [isLatValid, setIsLatValid] = useState(false);

  const [lonDeg, setLonDeg] = useState<number | null>(null);
  const [lonMin, setLonMin] = useState<number | null>(null);
  const [lonDir, setLonDir] = useState<"E" | "W">("E");
  const [isLonValid, setIsLonValid] = useState(false);

  const isTimeRequired = logType !== "DAILY";

  const isFormValid =
    !!date &&
    summary.trim().length > 0 &&
    (!isTimeRequired || (startTime && endTime)) &&
    (logType !== "BRIDGE" || (isLatValid && isLonValid));

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

    setLatDeg(null);
    setLatMin(null);
    setLatDir("N");
    setIsLatValid(false);

    setLonDeg(null);
    setLonMin(null);
    setLonDir("E");
    setIsLonValid(false);
  };

  /* =======================
     CRUD (unchanged)
     ======================= */

  const handleSave = () => {
    if (!isFormValid) return;

    const id = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    insertDailyLog({
      id,
      date: date!.toISOString(),
      type: logType,
      startTime: isTimeRequired
        ? startTime!.toISOString()
        : undefined,
      endTime: isTimeRequired
        ? endTime!.toISOString()
        : undefined,
      summary: summary.trim(),
      remarks: remarks.trim() || undefined,
    });

    setEntries((prev) => [
      {
        id,
        date: date!,
        type: logType,
        startTime: isTimeRequired ? startTime! : undefined,
        endTime: isTimeRequired ? endTime! : undefined,
        summary: summary.trim(),
        remarks: remarks.trim() || undefined,
      },
      ...prev,
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
  };

  const handleUpdate = () => {
    if (!editingLogId || !isFormValid) return;

    updateDailyLog({
      id: editingLogId,
      date: date!.toISOString(),
      type: logType,
      startTime: isTimeRequired
        ? startTime!.toISOString()
        : undefined,
      endTime: isTimeRequired
        ? endTime!.toISOString()
        : undefined,
      summary: summary.trim(),
      remarks: remarks.trim() || undefined,
    });

    setEntries((prev) =>
      prev.map((e) =>
        e.id === editingLogId
          ? {
              ...e,
              date: date!,
              type: logType,
              startTime: isTimeRequired ? startTime! : undefined,
              endTime: isTimeRequired ? endTime! : undefined,
              summary: summary.trim(),
              remarks: remarks.trim() || undefined,
            }
          : e
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
          if (editingLogId === id) resetForm();
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium">Diary & Watchkeeping</Text>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.filterRow}>
              {(Object.keys(LOG_TYPE_LABEL) as LogType[]).map(
                (t) => (
                  <Chip
                    key={t}
                    selected={logType === t}
                    onPress={() => setLogType(t)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {LOG_TYPE_LABEL[t]}
                  </Chip>
                )
              )}
            </View>

            <DateInputField
              label="Date"
              value={date}
              onChange={setDate}
              required
            />

            {isTimeRequired && (
              <>
                <View style={{ height: 12 }} />
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
              </>
            )}

            {/* BRIDGE ONLY */}
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
              {editingLogId && (
                <Button onPress={resetForm}>Cancel</Button>
              )}
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
  timeRow: { flexDirection: "row" },
  input: { marginTop: 12 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
});
