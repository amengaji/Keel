//keel-mobile/src/sea-service/sections/DeckMachineryManeuveringSection.tsx

/**
 * ============================================================
 * Sea Service — Deck Machinery & Maneuvering Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture deck machinery and maneuvering equipment details
 * - Deck / ETO focused section
 *
 * IMPORTANT DESIGN RULES:
 * - This section is DRAFT-SAFE
 *   → Partial data CAN be saved
 * - Completion is determined ONLY by SeaServiceWizard
 * - Keyboard must never hide inputs
 * - Clear toast feedback for save actions
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  HelperText,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key constant.
 * Must EXACTLY match the key used in:
 * - seaServiceSections.ts
 * - SeaServiceWizard.tsx
 */
const SECTION_KEY = "DECK_MACHINERY_MANEUVERING";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */
export default function DeckMachineryManeuveringSection() {
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * ------------------------------------------------------------
   * LOAD EXISTING DRAFT (IF ANY)
   * ------------------------------------------------------------
   */
  const existingData =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   * NOTE:
   * - All values are stored as strings
   * - This simplifies draft persistence and validation
   */
  const [form, setForm] = useState({
    anchorWindlassMakeType: "",
    mooringWinchesNumberType: "",
    anchorPortTypeWeight: "",
    anchorStarboardTypeWeight: "",
    chainLengthPortShackles: "",
    chainLengthStarboardShackles: "",
    bowThrusterPowerMake: "",
    sternThrusterPowerMake: "",
    steeringGearMakeModelType: "",
  });

  /**
   * Populate draft values on initial load
   */
  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      setForm((prev) => ({ ...prev, ...existingData }));
    }
  }, []);

  /**
   * ------------------------------------------------------------
   * VALIDATION (FOR STATUS ONLY)
   * ------------------------------------------------------------
   * ALL fields are mandatory for completion,
   * but saving is allowed even if incomplete.
   */
  const isFormComplete = useMemo(() => {
    return Object.values(form).every(
      (value) => String(value).trim() !== ""
    );
  }, [form]);

  /**
   * ------------------------------------------------------------
   * HANDLERS
   * ------------------------------------------------------------
   */
  const handleChange = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    /**
     * DRAFT-SAFE SAVE:
     * - Always persist data
     * - Completion handled by Wizard
     */
    updateSection(SECTION_KEY, form);

    if (isFormComplete) {
      toast.success(
        "Deck machinery & maneuvering section completed."
      );
    } else {
      toast.info(
        "Deck machinery details saved as draft."
      );
    }
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={24}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Deck Machinery & Maneuvering
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter deck machinery and maneuvering equipment details.
        All fields are required for completion.
      </Text>

      <Divider style={styles.divider} />

      {/* ---------------- WINDLASS & WINCHES ---------------- */}
      <TextInput
        label="Anchor Windlass Make & Type (Hydraulic / Electric)"
        value={form.anchorWindlassMakeType}
        onChangeText={(v) =>
          handleChange("anchorWindlassMakeType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Mooring Winches — Number & Type"
        value={form.mooringWinchesNumberType}
        onChangeText={(v) =>
          handleChange("mooringWinchesNumberType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- ANCHORS & CHAINS ---------------- */}
      <TextInput
        label="Anchor (Port) — Type & Weight"
        value={form.anchorPortTypeWeight}
        onChangeText={(v) =>
          handleChange("anchorPortTypeWeight", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Anchor (Starboard) — Type & Weight"
        value={form.anchorStarboardTypeWeight}
        onChangeText={(v) =>
          handleChange("anchorStarboardTypeWeight", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Chain Length (Port) — Shackles"
        value={form.chainLengthPortShackles}
        onChangeText={(v) =>
          handleChange("chainLengthPortShackles", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Chain Length (Starboard) — Shackles"
        value={form.chainLengthStarboardShackles}
        onChangeText={(v) =>
          handleChange("chainLengthStarboardShackles", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- THRUSTERS ---------------- */}
      <TextInput
        label="Bow Thruster — Power (kW) & Make"
        value={form.bowThrusterPowerMake}
        onChangeText={(v) =>
          handleChange("bowThrusterPowerMake", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Stern Thruster — Power (kW) & Make"
        value={form.sternThrusterPowerMake}
        onChangeText={(v) =>
          handleChange("sternThrusterPowerMake", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- STEERING GEAR ---------------- */}
      <TextInput
        label="Steering Gear — Make / Model / Type"
        value={form.steeringGearMakeModelType}
        onChangeText={(v) =>
          handleChange("steeringGearMakeModelType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {!isFormComplete && (
        <HelperText type="info" visible>
          All fields are required to mark this section as completed.
        </HelperText>
      )}

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

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 20,
  },
});
