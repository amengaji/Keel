//keel-mobile/src/screens/tasks/TasksHomeScreen.tsx

/**
 * ============================================================
 * TasksHomeScreen
 * ============================================================
 *
 * PURPOSE:
 * - Entry point for Tasks module
 * - Shows SECTION-LEVEL overview (not individual tasks)
 * - Read-only navigation screen
 *
 * IMPORTANT DESIGN RULES:
 * - NO task status mutation here
 * - NO attachments here
 * - NO assumptions about backend / API
 * - Safe even if SQLite has no task data yet
 *
 * UX GOAL:
 * - Cadet immediately understands:
 *   • What sections exist
 *   • How much is pending
 *   • What requires officer sign-off
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { KeelButton } from "../../components/ui/KeelButton";


import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { useToast } from "../../components/toast/useToast";
import { useNavigation } from "@react-navigation/native";

/**
 * ============================================================
 * SECTION MASTER MAP (HARD-CODED, SAFE)
 * ============================================================
 *
 * NOTE:
 * - This is derived from the UNIFIED MASTER TASK MAP
 * - This will later be replaced by DB / API-driven config
 * - For now, this gives us:
 *   • Predictable UX
 *   • Zero risk
 */

type TaskSection = {
  key: string;
  title: string;
};

const DECK_CADET_SECTIONS: TaskSection[] = [
  { key: "NAV", title: "Navigation & Passage Planning" },
  { key: "WATCH", title: "Bridge Watchkeeping" },
  { key: "COLREG", title: "COLREGs & Collision Avoidance" },
  { key: "RADAR", title: "Radar / ARPA / ECDIS & Electronic Navigation" },
  { key: "MET", title: "Meteorology & Weather Routing" },
  { key: "SAFETY", title: "Safety, Emergency & Life-Saving Appliances" },
  { key: "MANEUVER", title: "Ship Handling & Manoeuvring" },
  { key: "BRM", title: "Bridge Resource Management (BRM)" },
  { key: "DOCS", title: "Ship Documentation & Logs" },
];

/**
 * ============================================================
 * TasksHomeScreen Component
 * ============================================================
 */
export default function TasksHomeScreen() {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();

  /**
   * ------------------------------------------------------------
   * Local UI State
   * ------------------------------------------------------------
   *
   * For now:
   * - Progress is mocked as zero
   * - This avoids DB assumptions
   * - Will be wired later to SQLite safely
   */
  const [sections, setSections] = useState(DECK_CADET_SECTIONS);

  /**
   * ------------------------------------------------------------
   * Initial Load (Safe, Defensive)
   * ------------------------------------------------------------
   */
  useEffect(() => {
    try {
      // Future:
      // - Detect stream (Deck Cadet / Engine Cadet / Rating)
      // - Load progress from SQLite
      // For now:
      // - We only load section definitions
      setSections(DECK_CADET_SECTIONS);
    } catch (err) {
      console.error("Failed to load task sections", err);
      toast.error("Failed to load task sections");
    }
  }, [toast]);

  /**
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */
  return (
    <KeelScreen withVerticalInsets>
      {/* ========================================================
          Header
         ======================================================== */}
      <Text variant="titleLarge" style={styles.title}>
        Tasks
      </Text>

      <Text
        variant="bodyMedium"
        style={[
          styles.subtitle,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Training Record Book
      </Text>

      {/* ========================================================
          Section List
         ======================================================== */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
        <KeelCard
        title={item.title}
        subtitle="Mandatory tasks pending"
        >
        {/* Progress Placeholder */}
        <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
        >
            Progress: 0 / 10 tasks completed
        </Text>

        {/* Navigation Action */}
        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
            <KeelButton
            mode="secondary"
            onPress={() =>
                navigation.navigate("TaskSection", {
                sectionKey: item.key,
                sectionTitle: item.title,
                })
            }
            >
            Open
            </KeelButton>
        </View>
        </KeelCard>

        )}
      />
    </KeelScreen>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
});
