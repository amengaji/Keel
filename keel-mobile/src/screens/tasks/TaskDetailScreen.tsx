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
 * CADET UX GOALS:
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
 *
 * ============================================================
 * TASK GUIDANCE (OPTION D — STRUCTURED + BULLETS + ICON-READY)
 * ============================================================
 *
 * REQUIREMENT:
 * - Every task has guidance available via ⓘ icon
 * - Guidance is stored in SQLite (task_guidance)
 * - Guidance is READ-ONLY for cadets
 * - Guidance must be presented in a TRB-style, audit-safe layout
 *
 * DESIGN (LOCKED):
 * - Guidance is shown inside a Dialog (not a bottom sheet)
 * - Guidance is scrollable
 * - Guidance uses fixed section structure:
 *   1) Purpose
 *   2) What to Do (Steps)
 *   3) Common Mistakes
 *   4) Evidence Expected
 *   5) Officer Expectation
 *
 * ICON-READY:
 * - Each section header includes an icon placeholder (material icon name)
 * - We keep rendering logic centralized so icons can be upgraded later
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

// ✅ NEW: Guidance DB adapter (SQLite-backed)
import {
  ensureSeedTaskGuidanceExists,
  getTaskGuidanceByKey,
  TaskGuidanceRecord,
} from "../../db/taskGuidance";

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
 * Guidance section keys (kept explicit to avoid “magic strings” in UI)
 * This also makes future localization easier.
 */
type GuidanceSectionKey =
  | "PURPOSE"
  | "STEPS"
  | "MISTAKES"
  | "EVIDENCE"
  | "OFFICER";

/**
 * Guidance section metadata (ICON-READY)
 * - icon: material icon name used by react-native-paper
 * - title: visible heading inside dialog
 *
 * IMPORTANT:
 * - We keep these in one place so the UI stays consistent.
 */
const GUIDANCE_SECTIONS: {
  key: GuidanceSectionKey;
  title: string;
  icon: string; // icon name; paper uses MaterialCommunityIcons by default
}[] = [
  { key: "PURPOSE", title: "Purpose", icon: "target" },
  { key: "STEPS", title: "What to Do", icon: "format-list-bulleted" },
  { key: "MISTAKES", title: "Common Mistakes", icon: "alert-circle-outline" },
  { key: "EVIDENCE", title: "Evidence Expected", icon: "file-document-outline" },
  { key: "OFFICER", title: "Officer Expectation", icon: "account-check-outline" },
];

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
  // Local State: Task guidance (SQLite-backed)
  // ------------------------------------------------------------
  const [guidanceRecord, setGuidanceRecord] =
    useState<TaskGuidanceRecord | null>(null);

  /**
   * Guidance loading flags
   * - keep explicit so we can render correct UI states
   */
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [guidanceLoadError, setGuidanceLoadError] = useState<string | null>(
    null
  );

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
   * LOAD TASK GUIDANCE (SQLite-backed)
   * ============================================================
   *
   * KEY RULE:
   * - Guidance is template data (read-only)
   * - Cadets do not modify it
   * - If missing, show a safe fallback message (no crash)
   *
   * SEEDING:
   * - We call ensureSeedTaskGuidanceExists() defensively here.
   * - It is SAFE: it inserts only if table is empty.
   * - This guarantees Task 1/2 have guidance in your current prototype.
   */
  useEffect(() => {
    setIsGuidanceLoading(true);
    setGuidanceLoadError(null);

    try {
      // 1) Ensure seed exists (safe no-op after first run)
      ensureSeedTaskGuidanceExists();

      // 2) Load guidance for this taskKey
      const guide = getTaskGuidanceByKey(taskKey);

      // 3) Store in state
      setGuidanceRecord(guide);

      // 4) End loading
      setIsGuidanceLoading(false);
    } catch (err) {
      console.error("Failed to load task guidance:", err);

      // Defensive: show toast and also keep a local error string
      toast.error("Failed to load task guidance.");
      setGuidanceLoadError("Unable to load guidance right now.");
      setGuidanceRecord(null);
      setIsGuidanceLoading(false);
    }
  }, [taskKey, toast]);

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

  /**
   * ============================================================
   * Guidance Rendering Helpers (Option D)
   * ============================================================
   *
   * GOAL:
   * - Structured sections
   * - Bullet-friendly
   * - Future-ready for icons
   *
   * STORAGE FORMAT (Phase 1):
   * - guidance fields are stored as plain TEXT
   * - bullet lines are stored using newline separators
   *
   * Example steps TEXT in DB:
   * "• Step one\n• Step two\n• Step three"
   *
   * We support BOTH styles:
   * - If the line already starts with "•", we keep it
   * - Otherwise we auto-prefix bullets for list sections (Steps/Mistakes/Evidence)
   */

  /**
   * Determine whether a section should be rendered as a bullet list.
   * Purpose/Officer expectation may be paragraphs.
   */
  function isBulletSection(sectionKey: GuidanceSectionKey): boolean {
    return (
      sectionKey === "STEPS" ||
      sectionKey === "MISTAKES" ||
      sectionKey === "EVIDENCE"
    );
  }

  /**
   * Extract content from TaskGuidanceRecord by section key.
   * Kept as a function (not inline) to keep UI clean and auditable.
   */
  function getGuidanceTextBySection(
    record: TaskGuidanceRecord,
    sectionKey: GuidanceSectionKey
  ): string | null {
    switch (sectionKey) {
      case "PURPOSE":
        return record.purpose ?? null;
      case "STEPS":
        return record.steps ?? null;
      case "MISTAKES":
        return record.commonMistakes ?? null;
      case "EVIDENCE":
        return record.evidenceExpected ?? null;
      case "OFFICER":
        return record.officerExpectation ?? null;
      default:
        return null;
    }
  }

  /**
   * Convert a TEXT block into bullet lines.
   * - Splits on new lines
   * - Trims whitespace
   * - Removes empty lines
   * - Normalizes bullets (adds "• " if missing)
   */
  function toBulletLines(text: string): string[] {
    const rawLines = text.split("\n");

    const cleaned = rawLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return cleaned.map((line) => {
      // If already bullet-prefixed, keep it.
      if (line.startsWith("•")) return line;

      // Otherwise, add bullet prefix.
      return `• ${line}`;
    });
  }

  /**
   * Render a single bullet line row.
   *
   * ICON-READY:
   * - We intentionally leave a small bullet “dot” view.
   * - In future, replace this dot with a real icon per line.
   */
  function renderBulletLine(line: string, index: number) {
    return (
      <View key={`${index}_${line}`} style={styles.bulletRow}>
        <View style={styles.bulletDot} />
        <Text variant="bodySmall" style={styles.bulletText}>
          {line.replace(/^•\s?/, "")}
        </Text>
      </View>
    );
  }

  /**
   * Render one guidance section:
   * - Header row (icon + title)
   * - Body (paragraph or bullets)
   *
   * IMPORTANT:
   * - If content is missing, we hide the section completely.
   * - This prevents empty “boxes” that confuse cadets.
   */
  function renderGuidanceSection(
    sectionKey: GuidanceSectionKey,
    title: string,
    icon: string,
    content: string | null
  ) {
    if (!content) return null;

    const bulletMode = isBulletSection(sectionKey);

    return (
      <View style={styles.guidanceSection}>
        {/* Header (ICON-READY) */}
        <View style={styles.guidanceHeaderRow}>
          <IconButton
            icon={icon}
            size={18}
            style={styles.guidanceHeaderIcon}
            // read-only icon, no press action
            onPress={() => {}}
            disabled
          />

          <Text variant="titleSmall" style={styles.guidanceTitle}>
            {title}
          </Text>
        </View>

        {/* Body */}
        {bulletMode ? (
          <View style={styles.bulletsContainer}>
            {toBulletLines(content).map((line, idx) =>
              renderBulletLine(line, idx)
            )}
          </View>
        ) : (
          <Text variant="bodySmall" style={styles.guidanceParagraph}>
            {content}
          </Text>
        )}
      </View>
    );
  }

  /**
   * Render the full guidance content block (inside dialog scroll area).
   * This keeps the Dialog JSX simple and audit-friendly.
   */
  function renderGuidanceDialogBody() {
    // Loading state: keep it simple and clear.
    if (isGuidanceLoading) {
      return (
        <Text variant="bodySmall" style={styles.guidanceFallbackText}>
          Loading guidance…
        </Text>
      );
    }

    // Error state: show a safe message (do not crash).
    if (guidanceLoadError) {
      return (
        <Text variant="bodySmall" style={styles.guidanceFallbackText}>
          {guidanceLoadError}
        </Text>
      );
    }

    // Missing guidance: show safe fallback.
    if (!guidanceRecord) {
      return (
        <Text variant="bodySmall" style={styles.guidanceFallbackText}>
          Guidance for this task is not yet available.
        </Text>
      );
    }

    // Normal state: render structured sections.
    return (
      <View>
        {/* Optional: show stream/section classification (read-only) */}
        <View style={styles.guidanceMetaRow}>
          <Text
            variant="labelSmall"
            style={[styles.guidanceMetaText, { color: theme.colors.onSurfaceVariant }]}
          >
            Stream: {guidanceRecord.stream}
          </Text>

          <Text
            variant="labelSmall"
            style={[styles.guidanceMetaText, { color: theme.colors.onSurfaceVariant }]}
          >
            Section: {guidanceRecord.section}
          </Text>
        </View>

        <Divider style={styles.guidanceDivider} />

        {GUIDANCE_SECTIONS.map((s) => {
          const text = getGuidanceTextBySection(guidanceRecord, s.key);
          return renderGuidanceSection(s.key, s.title, s.icon, text);
        })}
      </View>
    );
  }

  return (
    <KeelScreen>
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
          
        {/* ======================================================
            ⓘ Task Guidance (alphabet i in circle)
            ------------------------------------------------------
            - Visible on TaskDetails only
            - Opens PSC-safe guidance dialog
            - This is NOT a state change, only information display
          ====================================================== */}
        <IconButton
          icon="information-outline"
          size={22}
          onPress={() => setShowInfoDialog(true)}
          accessibilityLabel="Task Guidance"
          style={styles.infoIcon}
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
          FIXED FOOTER (ANDROID + TAB BAR SAFE)
         ======================================================== */}
<View
  style={[
    styles.footer,
    {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: tabBarHeight,
      paddingBottom: insets.bottom + FOOTER_BREATHING_SPACE_PX,
      backgroundColor: theme.colors.background,
    },
  ]}
>
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
          TASK GUIDANCE (ⓘ) — SQLite-backed (Option D)
         ======================================================== */}
      <Portal>
        <Dialog
          visible={showInfoDialog}
          onDismiss={() => setShowInfoDialog(false)}
        >
          <Dialog.Title>Task Guidance</Dialog.Title>

          {/* 
            Dialog.ScrollArea makes long guidance scrollable 
            while keeping "Close" button visible.
          */}
          <Dialog.ScrollArea>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.guidanceScrollContent}
            >
              {renderGuidanceDialogBody()}
            </ScrollView>
          </Dialog.ScrollArea>

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
 * - guidance styles are intentionally verbose for future refinement.
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
    paddingBottom: 180, // breathing room above fixed footer
    paddingTop: 12,
  },

  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB", // theme border can be added later if you prefer
    paddingTop: 12,
  },

  /**
   * ============================================================
   * Guidance dialog styles (Option D)
   * ============================================================
   *
   * These are intentionally separated so we can refine UI later
   * without touching task logic or database calls.
   */
  guidanceScrollContent: {
    paddingVertical: 8,
  },

  guidanceFallbackText: {
    paddingVertical: 6,
  },

  guidanceMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  guidanceMetaText: {
    // kept explicit even if minor; audit readability
  },

  guidanceDivider: {
    marginBottom: 10,
  },

  guidanceSection: {
    marginBottom: 14,
  },

  guidanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  guidanceHeaderIcon: {
    margin: 0,
    padding: 0,
    marginRight: 6,
  },

  guidanceTitle: {
    fontWeight: "700",
  },

  guidanceParagraph: {
    // Paragraph spacing can be tuned later
    lineHeight: 18,
  },

  bulletsContainer: {
    marginTop: 2,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 10,
    // keep neutral; we can theme later if you want brand color
    backgroundColor: "#9CA3AF",
  },

  bulletText: {
    flex: 1,
    lineHeight: 18,
  },
  infoIcon: {
  marginLeft: 8,
},

});
