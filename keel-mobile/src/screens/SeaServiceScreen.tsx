//keel-mobile/src/screens/SeaServiceScreen.tsx

/**
 * ============================================================
 * Sea Service Dashboard
 * ============================================================
 *
 * MAIN Sea Service screen:
 * - Summary
 * - Service History vessel cards (later from SQLite)
 * - "Add Sea Service" opens wizard full-screen
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainStackParamList } from "../navigation/types";
import { useToast } from "../components/toast/useToast";

export default function SeaServiceScreen() {
  const theme = useTheme();
  const toast = useToast();

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  /**
   * TEMPORARY PLACEHOLDERS
   * ----------------------
   * These will later come from SQLite.
   */
  const totalSeaDays = 0;
  const vesselCount = 0;
  const seaServiceEntries: any[] = [];

  const handleAddSeaService = () => {
    // Navigates to full-screen wizard
    navigation.navigate("SeaServiceWizard");
    toast.info("Opening Sea Service wizard...");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Sea Service
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Record and track vessels you have served on
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Total Sea Days</Text>
            <Text variant="headlineSmall">{totalSeaDays}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Vessels</Text>
            <Text variant="headlineSmall">{vesselCount}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Vessel List */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Service History
        </Text>

        {seaServiceEntries.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No sea service records added yet.
              </Text>

              <Text variant="bodySmall" style={styles.emptySubtext}>
                Tap “Add Sea Service” to record your first vessel.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Future:
            - Map seaServiceEntries here
            - Render vessel cards with sign-on/off, rank, status
        */}
      </View>

      {/* Add Sea Service Button */}
      <Button mode="contained" style={styles.addButton} onPress={handleAddSeaService}>
        Add Sea Service
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontWeight: "700", marginBottom: 4 },
  subtitle: { opacity: 0.7 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1 },
  section: { marginTop: 12 },
  sectionTitle: { fontWeight: "600", marginBottom: 8 },
  emptyCard: { marginTop: 8 },
  emptyText: { textAlign: "center", marginBottom: 4 },
  emptySubtext: { textAlign: "center", opacity: 0.6 },
  addButton: { marginTop: 24 },
});
