//keel-mobile/src/screens/TaskDetailsScreen.tsx

/**
 * ============================================================
 * TaskDetailsScreen (TRB / PSC SAFE)
 * ============================================================
 *
 * THIS SCREEN IS COMPLIANCE-SENSITIVE:
 * - Must be inspector-safe
 * - Must be explicit in user intent (confirmations)
 * - Must be offline-first (SQLite)
 *
 * CADet UX GOALS:
 * - Cadet clearly understands:
 *   1) What the task is
 *   2) Why the task matters (ⓘ guidance)
 *   3) What evidence is expected (attachments)
 *   4) What happens when they submit (review/sign-off)
 *
 * ANDROID LAYOUT GOALS:
 * - Bottom action must NEVER be hidden behind:
 *   • Android system navigation bar (3 buttons / gesture)
 *   • React Navigation bottom tab bar
 *
 * FINAL FIX APPROACH:
 * - Screen content = ScrollView
 * - Bottom action bar = fixed footer outside ScrollView
 * - Footer padding = (safeAreaBottom + tabBarHeight + breathingSpace)
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  IconButton,
  useTheme,
  Divider,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelButton } from "../../components/ui/KeelButton";
import { useToast } from "../../components/toast/useToast";

import { MainStackParamList } from "../../navigation/types";
import { getTaskByKey, upsertTaskStatus } from "../../db/tasks";

/**
 * ============================================================
 * Types
 * ============================================================
 */

type Props = NativeStackScreenProps<MainStackParamList, "TaskDetails">;

/**
 * ============================================================
 * Constants (documented; no hidden magic numbers)
 * ============================================================
 *
 * FOOTER_BREATHING_SPACE_PX:
 * - Extra spacing above the physical screen edge
 * - Ensures comfortable tapping even with large thumbs / gloves
 * - Especially relevant for onboard tablet use
 */
const FOOTER_BREATHING_SPACE_PX = 16;

/**
 * ============================================================
 * TEMPORARY TASK KEY MAPPING
 * ============================================================
 *
 * NOTE:
 * - Current tasks are addressed as "D.<id>"
 * - Later we will migrate to stream/section aware keys:
 *   e.g. "DECK.NAV.001", "ENG.PUMP.014", etc.
 */
function mapTaskIdToTaskKey(id: number): string {
  return `D.${id}`;
}

/**
 * ============================================================
 * Screen Component
 * ============================================================
 */
export default function TaskDetailsScreen({ route }: Props) {
  const theme = useTheme();
  const toast = useToast();

  // Android + iOS safe area insets (system nav / home indicator)
  const insets = useSafeAreaInsets();

  // React Navigation bottom tab bar height (NOT included in safe area)
  const tabBarHeight = useBottomTabBarHeight();

  // ------------------------------------------------------------
  // Route Params
  // ------------------------------------------------------------
  const { id } = route.params;

  // Stable taskKey for DB access
  const taskKey = useMemo(() => mapTaskIdToTaskKey(id), [id]);

  // ------------------------------------------------------------
  // Local State: Task data
  // ------------------------------------------------------------
  const [taskTitle, setTaskTitle] = useState<string>("Loading task...");
  const [taskStatus, setTaskStatus] =
    useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");

  // ------------------------------------------------------------
  // Dialog State: PSC-safe confirmations
  // ------------------------------------------------------------
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ------------------------------------------------------------
  // Dialog State: Guidance / info
  // ------------------------------------------------------------
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  /**
   * ============================================================
   * LOAD TASK (OFFLINE-FIRST)
   * ============================================================
   *
   * Defensive rules:
   * - If DB fails, show toast + keep safe defaults
   * - Never crash the screen for missing record
   */
  useEffect(() => {
    try {
      const task = getTaskByKey(taskKey);

      if (task) {
        setTaskTitle(task.taskTitle);
        setTaskStatus(task.status);
      } else {
        // If not found, still keep the screen usable.
        // This can happen if seed data isn't present yet.
        setTaskTitle(`Task ${id}`);
        setTaskStatus("NOT_STARTED");
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
      toast.error("Failed to load task details.");
    }
  }, [id, taskKey, toast]);

  /**
   * ============================================================
   * Derived UI helpers
   * ============================================================
   */
  function renderStatusLabel(): string {
    switch (taskStatus) {
      case "COMPLETED":
        return "Submitted for review";
      case "IN_PROGRESS":
        return "In progress";
      default:
        return "Not started";
    }
  }

  function canShowStart(): boolean {
    return taskStatus === "NOT_STARTED";
  }

  function canShowSubmit(): boolean {
    return taskStatus === "IN_PROGRESS";
  }

  /**
   * ============================================================
   * ACTION HANDLERS (explicit, audit-safe)
   * ============================================================
   *
   * IMPORTANT:
   * - DB updates happen only after confirmation
   * - Local UI state updates after DB call succeeds
   */
  function handleConfirmStartTask() {
    try {
      upsertTaskStatus({
        taskKey,
        status: "IN_PROGRESS",
      });

      setTaskStatus("IN_PROGRESS");
      setShowStartConfirm(false);
      toast.success("Task marked as In Progress.");
    } catch (err) {
      console.error("Failed to start task:", err);
      toast.error("Failed to start task.");
    }
  }

  function handleConfirmSubmitTask() {
    try {
      upsertTaskStatus({
        taskKey,
        status: "COMPLETED",
      });

      setTaskStatus("COMPLETED");
      setShowSubmitConfirm(false);
      toast.success("Task submitted for review.");
    } catch (err) {
      console.error("Failed to submit task:", err);
      toast.error("Failed to submit task.");
    }
  }

  /**
   * ============================================================
   * Footer padding computation (critical Android fix)
   * ============================================================
   *
   * The footer must be tappable above BOTH:
   * - System nav bar (insets.bottom)
   * - Bottom tab bar (tabBarHeight)
   *
   * We add breathing space for comfort.
   */
  const footerPaddingBottom =
    insets.bottom + tabBarHeight + FOOTER_BREATHING_SPACE_PX;

  return (
    <KeelScreen withVerticalInsets>
      {/* ========================================================
          SCROLLABLE CONTENT AREA
          - This scrolls under normal circumstances
          - Footer stays fixed below
         ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --------------------------------------------------------
            Header row: title + ⓘ guidance icon
           -------------------------------------------------------- */}
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>
            {taskTitle}
          </Text>

          {/* ⓘ Information icon (alphabet I in a circle) */}
          <IconButton
            icon="information-outline"
            size={22}
            onPress={() => setShowInfoDialog(true)}
            accessibilityLabel="Task guidance"
          />
        </View>

        {/* --------------------------------------------------------
            Status line
           -------------------------------------------------------- */}
        <Text
          variant="labelMedium"
          style={[styles.statusLine, { color: theme.colors.onSurfaceVariant }]}
        >
          Status: {renderStatusLabel()}
        </Text>

        <Divider style={styles.divider} />

        {/* --------------------------------------------------------
            Task description (placeholder for now)
            Later: loaded from task template map / DB.
           -------------------------------------------------------- */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            What you need to do
          </Text>

          <Text variant="bodyMedium" style={styles.paragraph}>
            This task requires you to demonstrate understanding and practical
            competence as per Training Record Book expectations. Complete the
            activity onboard, record evidence, and submit for officer review.
          </Text>
        </View>

        {/* --------------------------------------------------------
            Evidence / attachments (placeholder for next step)
           -------------------------------------------------------- */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Evidence (Attachments)
          </Text>

          <Text
            variant="bodySmall"
            style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}
          >
            Attach photos, documents, or evidence for this task. Evidence helps
            the officer verify competence and strengthens audit readiness.
          </Text>

          <KeelButton mode="secondary" disabled onPress={() => {}}>
            Add Attachment (Coming Soon)
          </KeelButton>
        </View>

        {/* --------------------------------------------------------
            Review & sign-off explanation (cadet clarity)
           -------------------------------------------------------- */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Review & Sign-off
          </Text>

          <Text
            variant="bodySmall"
            style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}
          >
            After you submit, the task is considered completed by the cadet but
            remains pending officer verification until the CTO/Master signs it
            off. This is TRB-style evidence-based validation.
          </Text>
        </View>
      </ScrollView>

      {/* ========================================================
          FIXED FOOTER (Android + Tab bar safe)
         ======================================================== */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: footerPaddingBottom,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {/* NOTE:
            We do not show both buttons at once.
            This avoids ambiguity during inspection. */}

        {canShowStart() && (
          <KeelButton mode="primary" onPress={() => setShowStartConfirm(true)}>
            Start Task
          </KeelButton>
        )}

        {canShowSubmit() && (
          <KeelButton mode="primary" onPress={() => setShowSubmitConfirm(true)}>
            Submit for Officer Review
          </KeelButton>
        )}

        {/* If COMPLETED, footer intentionally shows no action.
            Later we will show:
            - "Awaiting Officer Sign-off" status chip
            - and read-only officer sign fields */}
      </View>

      {/* ========================================================
          START CONFIRMATION (PSC-safe)
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showStartConfirm}
          onDismiss={() => setShowStartConfirm(false)}
        >
          <Dialog.Title>Start Task</Dialog.Title>

          <Dialog.Content>
            <Text>
              Do you want to mark this task as In Progress?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowStartConfirm(false)}>Cancel</Button>
            <Button onPress={handleConfirmStartTask}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ========================================================
          SUBMIT CONFIRMATION (PSC-safe)
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showSubmitConfirm}
          onDismiss={() => setShowSubmitConfirm(false)}
        >
          <Dialog.Title>Submit Task</Dialog.Title>

          <Dialog.Content>
            <Text>
              Are you sure you want to submit this task for officer review?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowSubmitConfirm(false)}>Cancel</Button>
            <Button onPress={handleConfirmSubmitTask}>Yes, Submit</Button>
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
            <Text>
              This panel will contain clear guidance: purpose of the task,
              recommended steps onboard, common mistakes, and what evidence is
              acceptable for attachments. This is a key differentiator for KEEL.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowInfoDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeelScreen>
  );
}

/**
 * ============================================================
 * Styles
 * ============================================================
 *
 * Notes:
 * - scrollContent padding ensures content does not “kiss” footer.
 * - footer uses a divider line for clarity and “audit UX”.
 */
const styles = StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontWeight: "700",
    flex: 1,
  },

  statusLine: {
    marginTop: 6,
  },

  divider: {
    marginTop: 14,
    marginBottom: 4,
  },

  // Body sections
  section: {
    marginTop: 16,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  paragraph: {
    marginBottom: 10,
  },

  // Scroll content spacing
  scrollContent: {
    paddingBottom: 24, // breathing room above fixed footer
  },

  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB", // theme border can be added later if you prefer
    paddingTop: 12,
  },
});
