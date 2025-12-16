//keel-mobile/src/components/home/ComplianceIndicatorCard.tsx

/**
 * ============================================================
 * ComplianceIndicatorCard
 * ============================================================
 *
 * PURPOSE:
 * - Show a single compliance signal on Home Dashboard
 * - Inspector-grade wording, cadet-friendly explanation
 *
 * USED FOR:
 * - Sea Service
 * - Watchkeeping (STCW)
 * - Daily Logs health
 * - Tasks (future)
 * - Familiarisation (future)
 *
 * DESIGN RULES:
 * - Read-only (NO actions here)
 * - Status language must match maritime inspections
 * - Explicit "why this matters" helper text
 * - Theme-safe (light / dark)
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme, Divider } from "react-native-paper";

/**
 * ------------------------------------------------------------
 * Supported compliance states
 * ------------------------------------------------------------
 */
export type ComplianceStatus =
  | "ON_TRACK"
  | "ATTENTION"
  | "RISK"
  | "NOT_AVAILABLE";

interface Props {
  title: string;
  status: ComplianceStatus;
  summary: string;
  helperText?: string;
}

/**
 * ============================================================
 * Component
 * ============================================================
 */
export default function ComplianceIndicatorCard({
  title,
  status,
  summary,
  helperText,
}: Props) {
  const theme = useTheme();

  const statusMeta = getStatusMeta(status, theme);

  return (
    <Card style={[styles.card, { borderLeftColor: statusMeta.color }]}>
      <Card.Content>
        {/* ------------------------------------------------------
            Title
           ------------------------------------------------------ */}
        <Text variant="titleSmall" style={styles.title}>
          {title}
        </Text>

        <Divider style={styles.divider} />

        {/* ------------------------------------------------------
            Status line
           ------------------------------------------------------ */}
        <Text style={[styles.statusText, { color: statusMeta.color }]}>
          {statusMeta.label}
        </Text>

        <Text style={styles.summaryText}>{summary}</Text>

        {/* ------------------------------------------------------
            Helper text (Cadet self-awareness)
           ------------------------------------------------------ */}
        {helperText && (
          <View style={styles.helperBox}>
            <Text style={styles.helperLabel}>Why this matters</Text>
            <Text style={styles.helperText}>{helperText}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

/**
 * ============================================================
 * Status metadata resolver
 * ============================================================
 *
 * Centralised so language & colours stay consistent.
 */
function getStatusMeta(status: ComplianceStatus, theme: any) {
  switch (status) {
    case "ON_TRACK":
      return {
        label: "On Track",
        color: theme.colors.primary,
      };

    case "ATTENTION":
      return {
        label: "Attention Required",
        color: theme.colors.tertiary ?? theme.colors.warning ?? "#E6A700",
      };

    case "RISK":
      return {
        label: "Compliance Risk",
        color: theme.colors.error,
      };

    case "NOT_AVAILABLE":
    default:
      return {
        label: "Data Not Available",
        color: theme.colors.onSurfaceVariant,
      };
  }
}

/**
 * ============================================================
 * Styles
 * ============================================================
 */
const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },

  title: {
    fontWeight: "700",
  },

  divider: {
    marginVertical: 6,
  },

  statusText: {
    fontWeight: "700",
    marginBottom: 4,
  },

  summaryText: {
    opacity: 0.85,
    marginBottom: 6,
  },

  helperBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.03)",
  },

  helperLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    opacity: 0.7,
  },

  helperText: {
    fontSize: 12,
    opacity: 0.75,
  },
});
