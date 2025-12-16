//keel-mobile/src/screens/HomeScreen.tsx

/**
 * ============================================================
 * KEEL — Home Dashboard (Inspector / Compliance Mode)
 * ============================================================
 *
 * PURPOSE:
 * - This is NOT a marketing dashboard
 * - This is NOT a gamified progress screen
 *
 * This screen answers, at a glance:
 * 1) Who is the cadet?
 * 2) On which vessel?
 * 3) Is sea service progressing correctly?
 * 4) Are there compliance risks?
 *
 * DESIGN PRINCIPLES:
 * - Serious, calm, professional tone
 * - Inspector / Training Officer friendly
 * - Read-only snapshot (actions are minimal)
 * - Explicit placeholders (NO fake logic)
 * - Draft-safe and offline-safe
 *
 * IMPORTANT:
 * - No completion logic here
 * - No progress calculation here
 * - Real data wiring happens later
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";

import {KeelScreen} from "../components/ui/KeelScreen";
import { useSeaService } from "../sea-service/SeaServiceContext";
import { getSeaServiceSummary, } from "../sea-service/seaServiceStatus";
import ComplianceIndicatorCard from "../components/home/ComplianceIndicatorCard";
import { useDailyLogs } from "../daily-logs/DailyLogsContext";
import { checkStcwCompliance } from "../utils/stcwCompliance";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { useToast } from "../components/toast/useToast";


export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  
  // ------------------------------------------------------------
  // Sea Service data (single source of truth)
  // ------------------------------------------------------------
  const { payload } = useSeaService();

  const seaServiceSummary = getSeaServiceSummary(
    payload?.sections,
    payload?.shipType ?? undefined
  );

  const seaServiceStatusText =
    seaServiceSummary.completedSections === 0 &&
    seaServiceSummary.inProgressSections === 0
      ? "Not Started"
      : seaServiceSummary.inProgressSections > 0
      ? "Attention Needed"
      : "On Track";


  /**
   * NOTE:
   * All values below are placeholders.
   * They will be replaced once:
   * - Sea service progress derivation exists
   * - Watch hours logic exists
   * - Sync status is wired
   */
  const cadetName = "Cadet Name";
  const cadetCategory = "Deck Cadet";
  const vesselName = "Vessel Name";
  const shipType = "Ship Type";
  const seaServicePeriod = "DD MMM YYYY → DD MMM YYYY";
  const syncStatus = "Offline / Not synced";

  return (
    <KeelScreen>
    <ScrollView
    contentContainerStyle={{flexGrow:1}}
    showsVerticalScrollIndicator={false}
  >
      <View style={styles.container}>
        {/* ============================================================
            1) CADET & VESSEL IDENTITY (ALWAYS VISIBLE)
           ============================================================ */}
        <Card style={styles.identityCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.identityTitle}>
              Cadet & Vessel Identity
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Cadet:</Text> {cadetName}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Category:</Text> {cadetCategory}
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Vessel:</Text> {vesselName}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Ship Type:</Text> {shipType}
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.identityLine}>
              <Text style={styles.label}>Sea Service Period:</Text>{" "}
              {seaServicePeriod}
            </Text>
            <Text style={styles.identityLine}>
              <Text style={styles.label}>Sync Status:</Text> {syncStatus}
            </Text>
          </Card.Content>
        </Card>

        {/* ============================================================
            2) COMPLIANCE SNAPSHOT (PRIMARY FOCUS)
           ============================================================ */}
        <Card style={styles.primaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Compliance Snapshot
            </Text>

            <Divider style={styles.dividerSmall} />

        <Text style={styles.placeholderText}>
          Sea Service Status:{" "}
          <Text style={{ fontWeight: "700" }}>
            {seaServiceStatusText}
          </Text>
        </Text>

        <Text style={styles.placeholderSubText}>
          Sections completed:{" "}
          {seaServiceSummary.completedSections} /{" "}
          {seaServiceSummary.totalSections}
        </Text>


            <Text style={styles.placeholderSubText}>
              (No progress data available yet)
            </Text>
          </Card.Content>
        </Card>

        {/* ============================================================
            3) MANDATORY AREAS STATUS (SERIOUS GRID)
           ============================================================ */}
        {/* ============================================================
            3) COMPLIANCE INDICATORS (DERIVED — INSPECTOR SAFE)
           ============================================================ */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Compliance Indicators
        </Text>

        {/* --- Sea Service --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("SeaServiceWizard")}
        >
          <ComplianceIndicatorCard
            title="Sea Service"
            status={
              seaServiceSummary.inProgressSections > 0
                ? "ATTENTION"
                : seaServiceSummary.completedSections ===
                  seaServiceSummary.totalSections
                ? "ON_TRACK"
                : "NOT_AVAILABLE"
            }
            summary={`${seaServiceSummary.completedSections} of ${seaServiceSummary.totalSections} sections completed`}
            helperText="Sea service records are reviewed by training officers and flag state inspectors to confirm that your onboard training is progressing correctly."
          />
        </TouchableOpacity>


        {/* --- Watchkeeping (STCW) --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Daily")}
        >
          <WatchkeepingCompliance />
        </TouchableOpacity>


        {/* --- Daily Logs --- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Daily")}
        >
          <DailyLogsCompliance />
        </TouchableOpacity>


        {/* --- Tasks (future) --- */}
        <ComplianceIndicatorCard
          title="Tasks"
          status="NOT_AVAILABLE"
          summary="Task completion data is not yet available"
          helperText="Onboard task sign-offs demonstrate practical competence. This section will activate once tasks are recorded."
        />

        {/* --- Familiarisation (future) --- */}
        <ComplianceIndicatorCard
          title="Familiarisation"
          status="NOT_AVAILABLE"
          summary="Familiarisation progress is not yet available"
          helperText="Ship-specific familiarisation is mandatory under STCW and ISM requirements. This indicator will activate once data is linked."
        />


        {/* ============================================================
            4) ATTENTION REQUIRED (CONDITIONAL — PLACEHOLDER)
           ============================================================ */}
        <Card style={styles.attentionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.attentionTitle}>
              Attention Required
            </Text>

            <Divider style={styles.dividerSmall} />

            <Text style={styles.placeholderText}>
              Any compliance risks, missing sections, or required actions will
              be shown here automatically.
            </Text>

            <Text style={styles.placeholderSubText}>
              (Nothing to show right now)
            </Text>
          </Card.Content>
        </Card>

        {/* ============================================================
            5) RESTRICTED QUICK ACTIONS
           ============================================================ */}
        <View style={styles.actionsRow}>
          <Button mode="contained">
            Continue Sea Service
          </Button>

          <Button mode="outlined">
            Add Daily Log
          </Button>

          <Button mode="outlined">
            Sync Now
          </Button>
        </View>
      </View>
      </ScrollView>
    </KeelScreen>
  );
}

/* ============================================================
 * Small helper component (local, inspector-grade)
 * ============================================================ */
function StatusCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <Card style={styles.statusCard}>
      <Card.Content>
        <Text style={styles.statusTitle}>{title}</Text>
        <Divider style={styles.dividerSmall} />
        <Text style={styles.statusValue}>{status}</Text>
      </Card.Content>
    </Card>
  );
}

/* ============================================================
 * Watchkeeping Compliance Indicator
 * ============================================================ */
function WatchkeepingCompliance() {
  const { logs, loading } = useDailyLogs();

  if (loading) {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="NOT_AVAILABLE"
        summary="Loading watchkeeping data..."
      />
    );
  }

  if (logs.length === 0) {
    return (
      <ComplianceIndicatorCard
        title="Watchkeeping (STCW)"
        status="ATTENTION"
        summary="No watchkeeping records found"
        helperText="STCW requires accurate watch and rest-hour records. Missing data may be treated as non-compliance."
      />
    );
  }

  // 🔽 THIS LINE ALREADY EXISTS
  const result = checkStcwCompliance(logs, new Date());

  // 🔽 ADD THESE LINES IMMEDIATELY AFTER
  const hasViolations =
    Array.isArray((result as any).violations) &&
    (result as any).violations.length > 0;

    const toast = useToast();

/**
 * ------------------------------------------------------------
 * STCW Risk Warning (Cadet Awareness)
 * ------------------------------------------------------------
 * - Warning only
 * - Non-blocking
 * - Inspector-safe language
 */
React.useEffect(() => {
  if (hasViolations) {
      toast.warning(
        "STCW rest-hour limits exceeded. Please review your watchkeeping and rest hours immediately."
      );
  }
}, [hasViolations]);


  return (
    <ComplianceIndicatorCard
      title="Watchkeeping (STCW)"
      status={hasViolations ? "RISK" : "ON_TRACK"}
      summary={
        hasViolations
          ? "STCW rest-hour violations detected"
          : "Rest hour requirements are currently met"
      }
      helperText="STCW rest-hour compliance is verified during audits to prevent fatigue and ensure safe watchkeeping."
    />
  );
}


/* ============================================================
 * Daily Logs Compliance Indicator
 * ============================================================ */
function DailyLogsCompliance() {
  const { lastLogDate } = useDailyLogs();

  if (!lastLogDate) {
    return (
      <ComplianceIndicatorCard
        title="Daily Logs"
        status="ATTENTION"
        summary="No daily logs recorded yet"
        helperText="Daily logs are official records and must be maintained regularly during sea service."
      />
    );
  }

  return (
    <ComplianceIndicatorCard
      title="Daily Logs"
      status="ON_TRACK"
      summary={`Last entry: ${lastLogDate.toDateString()}`}
      helperText="Daily logs provide evidence of onboard activity and are commonly reviewed during inspections."
    />
  );
}


/* ============================================================
 * Styles
 * ============================================================ */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  identityCard: {
    marginBottom: 16,
  },
  identityTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  identityLine: {
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
  },

  primaryCard: {
    marginBottom: 20,
  },

  sectionHeader: {
    fontWeight: "700",
    marginBottom: 8,
  },

  sectionTitle: {
    fontWeight: "700",
  },

  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statusCard: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: "600",
  },
  statusValue: {
    opacity: 0.8,
  },

  attentionCard: {
    marginTop: 8,
    marginBottom: 20,
  },
  attentionTitle: {
    fontWeight: "700",
  },

  placeholderText: {
    opacity: 0.85,
  },
  placeholderSubText: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 12,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  dividerSmall: {
    marginVertical: 8,
  },


});
