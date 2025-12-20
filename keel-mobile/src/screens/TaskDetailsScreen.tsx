//keel-mobile/src/screens/TaskDetailsScreen.tsx

/**
 * ============================================================
 * Task Details Screen
 * ============================================================
 *
 * RESPONSIBILITIES:
 * - Display task details
 * - Ask confirmation before:
 *   - Starting a task (NOT_STARTED → IN_PROGRESS)
 *   - Completing a task (IN_PROGRESS → COMPLETED)
 *
 * IMPORTANT:
 * - Inspector-safe (explicit intent confirmations)
 * - Offline-first (SQLite)
 * - No UI redesign
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Dialog, Portal } from "react-native-paper";
import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelButton } from "../components/ui/KeelButton";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../navigation/types";
import { getTaskByKey, upsertTaskStatus } from "../db/tasks";
import { useToast } from "../components/toast/useToast";

type Props = NativeStackScreenProps<MainStackParamList, "TaskDetails">;

/**
 * ------------------------------------------------------------
 * Helper: map numeric id → taskKey
 * ------------------------------------------------------------
 */
function mapTaskIdToTaskKey(id: number): string {
  return `D.${id}`;
}

export default function TaskDetailsScreen({ route }: Props) {
  const toast = useToast();

  // ------------------------------------------------------------
  // Dialog state
  // ------------------------------------------------------------
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const { id } = route.params;
  const taskKey = mapTaskIdToTaskKey(id);

  // ------------------------------------------------------------
  // Check if task needs START confirmation
  // ------------------------------------------------------------
  useEffect(() => {
    try {
      const task = getTaskByKey(taskKey);
      if (task && task.status === "NOT_STARTED") {
        setShowStartConfirm(true);
      }
    } catch (err) {
      console.error("Failed to load task:", err);
      toast.error("Failed to load task.");
    }
  }, [taskKey, toast]);

  return (
    <KeelScreen>
      {/* ============================================================
          Header
         ============================================================ */}
      <Text variant="titleLarge" style={{ fontWeight: "700" }}>
        Task {id}
      </Text>

      <Text variant="bodyMedium" style={styles.desc}>
        Task description will be shown here.
      </Text>

      {/* ============================================================
          Action Area
         ============================================================ */}
      <View style={styles.bottom}>
        <KeelButton
          mode="primary"
          onPress={() => setShowCompleteConfirm(true)}
        >
          Submit for CTO Review
        </KeelButton>
      </View>

      {/* ============================================================
          START TASK CONFIRMATION
         ============================================================ */}
      <Portal>
        <Dialog
          visible={showStartConfirm}
          onDismiss={() => setShowStartConfirm(false)}
        >
          <Dialog.Title>Start Task</Dialog.Title>

          <Dialog.Content>
            <Text>
              Do you want to start working on this task now?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowStartConfirm(false)}>
              No
            </Button>

            <Button
              onPress={() => {
                try {
                  upsertTaskStatus({
                    taskKey,
                    status: "IN_PROGRESS",
                  });

                  setShowStartConfirm(false);
                  toast.success("Task marked as In Progress.");
                } catch (err) {
                  console.error("Failed to start task:", err);
                  toast.error("Failed to start task.");
                }
              }}
            >
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ============================================================
          COMPLETE TASK CONFIRMATION
         ============================================================ */}
      <Portal>
        <Dialog
          visible={showCompleteConfirm}
          onDismiss={() => setShowCompleteConfirm(false)}
        >
          <Dialog.Title>Submit Task</Dialog.Title>

          <Dialog.Content>
            <Text>
              Are you sure you want to submit this task as completed?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowCompleteConfirm(false)}>
              Cancel
            </Button>

            <Button
              onPress={() => {
                try {
                  upsertTaskStatus({
                    taskKey,
                    status: "COMPLETED",
                  });

                  setShowCompleteConfirm(false);
                  toast.success("Task marked as Completed.");
                } catch (err) {
                  console.error("Failed to complete task:", err);
                  toast.error("Failed to complete task.");
                }
              }}
            >
              Yes, Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  desc: {
    marginTop: 12,
    color: "#6B7280",
  },
  bottom: {
    marginTop: "auto",
  },
});
