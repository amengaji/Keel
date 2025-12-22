//keel-mobile/src/screens/SeaServiceScreen.tsx

/**
 * ============================================================
 * Sea Service Dashboard — Lifecycle View
 * ============================================================
 *
 * PURPOSE:
 * - Show ACTIVE sea service as a primary card
 * - Allow cadet to continue service without restarting wizard
 * - Hide "Add Sea Service" while service is in progress
 *
 * IMPORTANT:
 * - READ-ONLY screen
 * - NO finalize logic here
 * - NO DB writes
 */

import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Chip, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainStackParamList } from "../navigation/types";
import { useToast } from "../components/toast/useToast";
import { getSeaServiceRecord } from "../db/seaService";
import { useSeaService } from "../sea-service/SeaServiceContext";


function formatDate(
  value: string | Date | null | undefined
) {
  if (!value) return "—";

  const d =
    value instanceof Date
      ? value
      : new Date(value);

  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString();
}



export default function SeaServiceScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { startNewDraft } = useSeaService();

  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  /**
   * ============================================================
   * LOAD CURRENT SEA SERVICE (OPTION A — SINGLE ACTIVE RECORD)
   * ============================================================
   */
  const seaServiceRecord = useMemo(() => {
    try {
      return getSeaServiceRecord();
    } catch (err) {
      console.error("Failed to load Sea Service record:", err);
      toast.error("Failed to load Sea Service data.");
      return null;
    }
  }, [toast]);

  /**
   * ============================================================
   * DERIVED STATE
   * ============================================================
   */
    const isDraft =
      !!seaServiceRecord &&
      seaServiceRecord.status === "DRAFT";

    const isFinalized =
      !!seaServiceRecord &&
      seaServiceRecord.status === "FINAL";



  /**
   * ============================================================
   * HANDLERS
   * ============================================================
   */
  const handleContinueService = () => {
    navigation.navigate("SeaServiceWizard");
    toast.info("Continuing Sea Service...");
  };

  const handleAddSeaService = () => {
    startNewDraft();
    navigation.navigate("SeaServiceWizard");
    toast.info("Starting new Sea Service...");
  };


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* --------------------------------------------------------
          Header
         -------------------------------------------------------- */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Sea Service
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Track your sea-going service and vessel details
        </Text>
      </View>

      {/* --------------------------------------------------------
          ACTIVE SERVICE CARD
         -------------------------------------------------------- */}
      {isDraft && (
        <Card style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                {seaServiceRecord.shipName || "Sea Service (Draft)"}
              </Text>

              <Chip mode="outlined">IN PROGRESS</Chip>
            </View>

            {seaServiceRecord.imoNumber && (
              <Text variant="bodySmall" style={styles.metaText}>
                IMO: {seaServiceRecord.imoNumber}
              </Text>
            )}

            <Text variant="bodySmall" style={styles.metaText}>
              Sign On: {formatDate(seaServiceRecord.payload.servicePeriod?.signOnDate)}
            </Text>

            <Text variant="bodySmall" style={styles.metaText}>
              Sign Off: {formatDate(seaServiceRecord.payload.servicePeriod?.signOffDate)}
            </Text>
          </Card.Content>

          <Card.Actions>
            <Button mode="contained" onPress={handleContinueService}>
              Continue
            </Button>
          </Card.Actions>
        </Card>
      )}

    {isFinalized && (
      <Card style={styles.serviceCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={{ fontWeight: "600" }}>
              {seaServiceRecord.shipName || "Completed Sea Service"}
            </Text>

            <Chip mode="outlined">COMPLETED</Chip>
          </View>

          {seaServiceRecord.imoNumber && (
            <Text variant="bodySmall" style={styles.metaText}>
              IMO: {seaServiceRecord.imoNumber}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.metaText}>
            Sign On:{" "}
            {formatDate(seaServiceRecord.payload.servicePeriod?.signOnDate)}
          </Text>

          <Text variant="bodySmall" style={styles.metaText}>
            Sign Off:{" "}
            {formatDate(seaServiceRecord.payload.servicePeriod?.signOffDate)}
          </Text>
        </Card.Content>
      </Card>
    )}


      {/* --------------------------------------------------------
          EMPTY STATE (NO ACTIVE SERVICE)
         -------------------------------------------------------- */}
      {!isDraft && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No active sea service.
            </Text>

            <Text variant="bodySmall" style={styles.emptySubtext}>
              Start a new sea service when you sign on to a vessel.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --------------------------------------------------------
          ADD SEA SERVICE CTA
          - Only shown when no active service exists
         -------------------------------------------------------- */}
      <Button
        mode="contained"
        style={styles.addButton}
        disabled={isDraft}
        onPress={handleAddSeaService}
      >
        Add Sea Service
      </Button>

      {isDraft && (
        <Text
          variant="bodySmall"
          style={{ textAlign: "center", marginTop: 8, opacity: 0.6 }}
        >
          Complete and finalize the current Sea Service before adding a new one.
        </Text>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontWeight: "700", marginBottom: 4 },
  subtitle: { opacity: 0.7 },

  serviceCard: { marginBottom: 16 },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  metaText: {
    opacity: 0.7,
    marginTop: 4,
  },

  emptyCard: { marginTop: 8 },
  emptyText: { textAlign: "center", marginBottom: 4 },
  emptySubtext: { textAlign: "center", opacity: 0.6 },

  addButton: { marginTop: 24 },
});
