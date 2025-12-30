//keel-mobile/src/screens/TaskDetailsScreen.tsx

/**
 * ============================================================
 * Task Details Screen — ADVANCED (PSC / TRB SAFE)
 * ============================================================
 *
 * PURPOSE:
 * - Display task details
 * - Provide structured guidance (ⓘ) for cadets
 * - Enforce explicit confirmations (audit-safe)
 * - Remain fully usable on Android tablets (3-button / gesture)
 *
 * IMPORTANT:
 * - Offline-first (SQLite)
 * - No backend assumptions
 * - Bottom tabs remain visible
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  IconButton,
  Divider,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelButton } from "../components/ui/KeelButton";
import { useToast } from "../components/toast/useToast";

import { getTaskByKey, upsertTaskStatus } from "../db/tasks";
import { getStaticTaskByKey } from "../tasks/taskCatalog.static";

import { TasksStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetails">;


/**
 * Extra breathing space above Android system nav
 * Important for onboard tablet usability
 */
const FOOTER_BREATHING_SPACE = 16;

export default function TaskDetailsScreen({ route }: Props) {
  const theme = useTheme();
  const toast = useToast();

  // System safety
  const insets = useSafeAreaInsets();

  const { taskKey } = route.params;

  // ------------------------------------------------------------
  // Task state
  // ------------------------------------------------------------
  const [title, setTitle] = useState("Loading task…");
  const [description, setDescription] = useState("");
  const [hasCatalogData, setHasCatalogData] = useState(true);
  const [status, setStatus] =
    useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");

  // ------------------------------------------------------------
  // Dialog state
  // ------------------------------------------------------------
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  /**
   * ============================================================
   * LOAD TASK (SAFE, OFFLINE-FIRST)
   * ============================================================
   */
  useEffect(() => {
    try {
      const staticTask = getStaticTaskByKey(taskKey);

      if (staticTask) {
        setTitle(staticTask.title);
        setDescription(staticTask.description);
        setHasCatalogData(true);
      } else {
        setTitle(taskKey);
        setDescription("");
        setHasCatalogData(false);
      }


      const record = getTaskByKey(taskKey);
      if (record) setStatus(record.status);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task.");
    }
  }, [taskKey, toast]);

  /**
   * ============================================================
   * ACTION HANDLERS (AUDIT SAFE)
   * ============================================================
   */
  function handleStartTask() {
    try {
      upsertTaskStatus({ taskKey, status: "IN_PROGRESS" });
      setStatus("IN_PROGRESS");
      setShowStartConfirm(false);
      toast.success("Task marked as In Progress.");
    } catch {
      toast.error("Failed to start task.");
    }
  }

  function handleSubmitTask() {
    try {
      upsertTaskStatus({ taskKey, status: "COMPLETED" });
      setStatus("COMPLETED");
      setShowSubmitConfirm(false);
      toast.success("Task submitted for officer review.");
    } catch {
      toast.error("Failed to submit task.");
    }
  }

  const footerPadding =
    insets.bottom ;

  return (
    <KeelScreen>
      {/* ========================================================
          SCROLLABLE CONTENT
         ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>

          <IconButton
            icon="information-outline"
            size={22}
            onPress={() => setShowInfoDialog(true)}
            accessibilityLabel="Task Guidance"
          />
        </View>

        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Status:{" "}
          {status === "COMPLETED"
            ? "Submitted"
            : status === "IN_PROGRESS"
            ? "In Progress"
            : "Not Started"}
        </Text>

        <Divider style={styles.divider} />
        {!hasCatalogData && (
          <View
            style={[
              styles.noticeBox,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <IconButton
              icon="information-outline"
              size={18}
              style={styles.noticeIcon}
            />

            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
            >
              Guidance for this task is not available in the catalog. You may still
              complete the task based on onboard instructions and officer guidance.
            </Text>
          </View>
        )}


        <Text variant="titleSmall" style={styles.sectionTitle}>
          What you need to do
        </Text>

        <Text variant="bodyMedium" style={styles.paragraph}>
          {description}
        </Text>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Evidence
        </Text>

        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Attachments will be required for officer verification.
        </Text>

        <KeelButton mode="secondary" disabled onPress={() => {}}>
          Add Attachment (Coming Soon)
        </KeelButton>
      </ScrollView>

      {/* ========================================================
          FIXED FOOTER (ANDROID SAFE)
         ======================================================== */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: footerPadding,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {status === "NOT_STARTED" && (
          <KeelButton
            mode="primary"
            onPress={() => setShowStartConfirm(true)}
          >
            Start Task
          </KeelButton>
        )}

        {status === "IN_PROGRESS" && (
          <KeelButton
            mode="primary"
            onPress={() => setShowSubmitConfirm(true)}
          >
            Submit for Officer Review
          </KeelButton>
        )}
      </View>

      {/* ========================================================
          CONFIRMATIONS (PSC SAFE)
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showStartConfirm}
          onDismiss={() => setShowStartConfirm(false)}
        >
          <Dialog.Title>Start Task</Dialog.Title>
          <Dialog.Content>
            <Text>Mark this task as In Progress?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStartConfirm(false)}>
              Cancel
            </Button>
            <Button onPress={handleStartTask}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={showSubmitConfirm}
          onDismiss={() => setShowSubmitConfirm(false)}
        >
          <Dialog.Title>Submit Task</Dialog.Title>
          <Dialog.Content>
            <Text>Submit this task for officer review?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button onPress={handleSubmitTask}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ========================================================
          TASK GUIDANCE (ⓘ)
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showInfoDialog}
          onDismiss={() => setShowInfoDialog(false)}
        >
          <Dialog.Title>Task Guidance</Dialog.Title>
          <Dialog.Content>
            {hasCatalogData ? (
              <Text variant="bodySmall">
                This task must be completed in accordance with onboard
                procedures, Master's standing orders, and officer guidance.
                Ensure you understand the objective before submitting.
              </Text>
            ) : (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Formal guidance for this task is not available in the digital
                catalog. This is not an error.

                {"\n\n"}
                Complete the task as instructed by the supervising officer
                and in accordance with onboard procedures. Evidence and
                officer verification may still be required.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInfoDialog(false)}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 12,
    paddingBottom: 200,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "700",
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 12,
  },
  noticeBox: {
  flexDirection: "row",
  alignItems: "flex-start",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
},

noticeIcon: {
  margin: 0,
  marginRight: 6,
},

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
});
