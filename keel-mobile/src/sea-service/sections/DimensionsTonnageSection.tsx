//keel-mobile/src/sea-service/sections/DimensionsTonnageSection.tsx

/**
 * ============================================================
 * Dimensions & Tonnages Section
 * ============================================================
 *
 * Captures principal dimensions and tonnage particulars.
 *
 * RULES:
 * - Partial save allowed
 * - Completed status will be handled in SeaServiceWizard.tsx
 * - Uses KeyboardAwareScrollView to avoid keyboard overlap
 */

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

export default function DimensionsTonnageSection() {
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * Load existing saved values (if any)
   */
  const existing =
    payload.sections.DIMENSIONS_TONNAGE ?? {};

  /**
   * Local state (editable)
   * NOTE: Keep values as strings for easier typing.
   * Later we can validate/convert to numbers.
   */
  const [grossTonnage, setGrossTonnage] = useState(
    existing.grossTonnage ?? ""
  );
  const [netTonnage, setNetTonnage] = useState(
    existing.netTonnage ?? ""
  );
  const [deadweightTonnage, setDeadweightTonnage] = useState(
    existing.deadweightTonnage ?? ""
  );
  const [loaMeters, setLoaMeters] = useState(
    existing.loaMeters ?? ""
  );
  const [breadthMeters, setBreadthMeters] = useState(
    existing.breadthMeters ?? ""
  );
  const [summerDraftMeters, setSummerDraftMeters] = useState(
    existing.summerDraftMeters ?? ""
  );

  /**
   * Save into context (draft-safe)
   */
  const handleSave = () => {
    updateSection("DIMENSIONS_TONNAGE", {
      grossTonnage,
      netTonnage,
      deadweightTonnage,
      loaMeters,
      breadthMeters,
      summerDraftMeters,
    });

    toast.success("Dimensions & Tonnages saved.");
  };

  return (
    <KeyboardAwareScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 120 },
      ]}
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Dimensions & Tonnages
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter key tonnage and dimensional particulars. You can save
        even if incomplete.
      </Text>

      <Divider style={styles.divider} />

      {/* Gross Tonnage */}
      <TextInput
        label="Gross Tonnage (GT)"
        value={grossTonnage}
        onChangeText={setGrossTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 45000"
      />

      {/* Net Tonnage */}
      <TextInput
        label="Net Tonnage (NT)"
        value={netTonnage}
        onChangeText={setNetTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 28000"
      />

      {/* Deadweight */}
      <TextInput
        label="Deadweight Tonnage (DWT)"
        value={deadweightTonnage}
        onChangeText={setDeadweightTonnage}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 76000"
      />

      <Divider style={styles.divider} />

      {/* LOA */}
      <TextInput
        label="Length Overall (LOA) (m)"
        value={loaMeters}
        onChangeText={setLoaMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 228.5"
      />

      {/* Breadth */}
      <TextInput
        label="Breadth (m)"
        value={breadthMeters}
        onChangeText={setBreadthMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 32.2"
      />

      {/* Summer Draft */}
      <TextInput
        label="Summer Draft (m)"
        value={summerDraftMeters}
        onChangeText={setSummerDraftMeters}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g. 13.8"
      />

      <Button
        mode="contained"
        style={styles.saveButton}
        onPress={handleSave}
      >
        Save Section
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  input: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 16,
  },
});
