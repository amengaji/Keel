//keel-mobile/src/screens/tasks/TaskSectionScreen.tsx

/**
 * ============================================================
 * TaskSectionScreen
 * ============================================================
 *
 * PURPOSE:
 * - Display all tasks within a selected section
 * - Separate Mandatory and Optional tasks
 * - Allow navigation to TaskDetailScreen
 *
 * IMPORTANT:
 * - READ-ONLY screen
 * - NO status mutation here
 * - NO attachments here
 * - Inspector-safe listing
 */

import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelButton } from "../../components/ui/KeelButton";

/**
 * ============================================================
 * Route Params (DEFENSIVE)
 * ============================================================
 */
type RouteParams = {
  sectionKey: string;
  sectionTitle: string;
};

/**
 * ============================================================
 * TEMPORARY TASK MODEL (SAFE PLACEHOLDER)
 * ============================================================
 *
 * NOTE:
 * - This will later come from SQLite
 * - For now, we keep it explicit and readable
 */
type TaskItem = {
  taskKey: string;
  id: number;
  title: string;
  mandatory: boolean;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED_BY_CADET" | "SIGNED_OFF";
};

/**
 * ============================================================
 * TEMPORARY TASK DATA (PER SECTION)
 * ============================================================
 *
 * NOTE:
 * - This is ONLY to enable UX flow
 * - Will be replaced with DB-driven data
 */
const MOCK_TASKS_BY_SECTION: Record<string, TaskItem[]> = {
  NAV: [
    {
      id: 1,
      taskKey: "DC.NAV.001",
      title: "Identify and explain use of nautical charts",
      mandatory: true,
      status: "NOT_STARTED",
    },
    {
      id: 2,
      taskKey: "DC.NAV.002",
      title: "Assist in preparation of passage plan",
      mandatory: true,
      status: "NOT_STARTED",
    },
    {
      id: 3,
      taskKey: "DC.NAV.003",
      title: "Observe position fixing methods",
      mandatory: false,
      status: "NOT_STARTED",
    },
  ],
};


/**
 * ============================================================
 * TaskSectionScreen Component
 * ============================================================
 */
export default function TaskSectionScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { sectionKey, sectionTitle } = route.params as RouteParams;

  const tasks = MOCK_TASKS_BY_SECTION[sectionKey] ?? [];

  const mandatoryTasks = tasks.filter((t) => t.mandatory);
  const optionalTasks = tasks.filter((t) => !t.mandatory);

  /**
   * ------------------------------------------------------------
   * Helper: Status label
   * ------------------------------------------------------------
   */
  function renderStatus(status: TaskItem["status"]) {
    switch (status) {
      case "SIGNED_OFF":
        return "Signed Off";
      case "COMPLETED_BY_CADET":
        return "Submitted";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return "Not Started";
    }
  }

  return (
    <KeelScreen>
      {/* ========================================================
          Header
         ======================================================== */}
      <Text variant="titleLarge" style={styles.title}>
        {sectionTitle}
      </Text>

      {/* ========================================================
          Mandatory Tasks
         ======================================================== */}
      <Text
        variant="titleMedium"
        style={[styles.groupTitle, { color: theme.colors.primary }]}
      >
        Mandatory Tasks
      </Text>

      <FlatList
        data={mandatoryTasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <KeelCard title={item.title} subtitle={renderStatus(item.status)}>
            <View style={styles.cardFooter}>
              <KeelButton
                mode="secondary"
                onPress={() =>
                  navigation.navigate("TaskDetails", { taskKey: item.taskKey, })
                }
              >
                Open
              </KeelButton>
            </View>
          </KeelCard>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No mandatory tasks.</Text>
        }
      />

      {/* ========================================================
          Optional Tasks
         ======================================================== */}
      <Text
        variant="titleMedium"
        style={[
          styles.groupTitle,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Optional Tasks
      </Text>

      <FlatList
        data={optionalTasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <KeelCard title={item.title} subtitle={renderStatus(item.status)}>
            <View style={styles.cardFooter}>
              <KeelButton
                mode="secondary"
                onPress={() =>
                  navigation.navigate("TaskDetails", { id: item.id })
                }
              >
                Open
              </KeelButton>
            </View>
          </KeelCard>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No optional tasks in this section.
          </Text>
        }
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
    marginBottom: 16,
  },
  groupTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  cardFooter: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  emptyText: {
    marginVertical: 8,
    color: "#6B7280",
  },
});
