//keel-mobile/src/sea-service/sections/PropulsionPerformanceSection.tsx

/**
 * ============================================================
 * Sea Service — Main Propulsion & Performance Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture propulsion and performance particulars
 * - Mandatory section (all fields required)
 * - Draft-safe: user can save and return anytime
 *
 * DESIGN RULES:
 * - Keyboard-safe scrolling
 * - Explicit validation before save
 * - Toast feedback for success / error
 * - Light & dark mode compatible
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Divider,
  HelperText,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * Section key constant
 * (kept explicit to avoid typos)
 */
const SECTION_KEY = "PROPULSION_PERFORMANCE";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */
export default function PropulsionPerformanceSection() {
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   * Loaded from context draft (if exists)
   */
  const existingData =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState({
    mainEngineMakeModel: "",
    mainEngineType: "",
    numberOfMainEngines: "",
    mcrPower: "",
    rpmAtMcr: "",
    serviceSpeedKnots: "",
    fuelTypes: "",
    dailyFuelConsumption: "",
    propellerType: "",
    numberOfPropellers: "",
    rudderType: "",
  });

  /**
   * Load draft data on mount
   */
  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      setForm((prev) => ({ ...prev, ...existingData }));
    }
  }, []);

  /**
   * ------------------------------------------------------------
   * VALIDATION
   * ------------------------------------------------------------
   * All fields are mandatory in this section
   */
  const isFormValid = useMemo(() => {
    return Object.values(form).every(
      (value) => value !== null && String(value).trim() !== ""
    );
  }, [form]);

  /**
   * ------------------------------------------------------------
   * HANDLERS
   * ------------------------------------------------------------
   */
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    if (!isFormValid) {
      toast.error("Please complete all propulsion fields before saving.");
      return;
    }

    updateSection(SECTION_KEY, form);

    toast.success("Main propulsion & performance details saved.");
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
        Main Propulsion & Performance
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter main engine and propulsion performance details. All fields are
        mandatory.
      </Text>

      <Divider style={styles.divider} />

      {/* ---------------- MAIN ENGINE ---------------- */}
      <TextInput
        label="Main Engine Make & Model"
        value={form.mainEngineMakeModel}
        onChangeText={(v) =>
          handleChange("mainEngineMakeModel", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Main Engine Type (2-stroke / 4-stroke)"
        value={form.mainEngineType}
        onChangeText={(v) =>
          handleChange("mainEngineType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Number of Main Engines"
        value={form.numberOfMainEngines}
        onChangeText={(v) =>
          handleChange("numberOfMainEngines", v)
        }
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Maximum Continuous Rating (kW / BHP)"
        value={form.mcrPower}
        onChangeText={(v) => handleChange("mcrPower", v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="RPM at MCR"
        value={form.rpmAtMcr}
        onChangeText={(v) => handleChange("rpmAtMcr", v)}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- PERFORMANCE ---------------- */}
      <TextInput
        label="Service Speed (knots)"
        value={form.serviceSpeedKnots}
        onChangeText={(v) =>
          handleChange("serviceSpeedKnots", v)
        }
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Fuel Type(s) (HFO / MDO / LNG / etc.)"
        value={form.fuelTypes}
        onChangeText={(v) => handleChange("fuelTypes", v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Daily Fuel Consumption (at service speed)"
        value={form.dailyFuelConsumption}
        onChangeText={(v) =>
          handleChange("dailyFuelConsumption", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- PROPULSION ---------------- */}
      <TextInput
        label="Propeller Type (Fixed / CPP)"
        value={form.propellerType}
        onChangeText={(v) =>
          handleChange("propellerType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Number of Propellers"
        value={form.numberOfPropellers}
        onChangeText={(v) =>
          handleChange("numberOfPropellers", v)
        }
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Rudder Type (Spade / Semi-balanced / etc.)"
        value={form.rudderType}
        onChangeText={(v) =>
          handleChange("rudderType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {!isFormValid && (
        <HelperText type="error" visible>
          All fields in this section are mandatory.
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
