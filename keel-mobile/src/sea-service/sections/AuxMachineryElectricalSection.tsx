//keel-mobile/src/sea-service/sections/AuxMachineryElectricalSection.tsx

/**
 * ============================================================
 * Sea Service — Auxiliary Machinery & Electrical Section
 * ============================================================
 *
 * PURPOSE:
 * - Capture auxiliary machinery and electrical particulars
 * - Engine / ETO focused section
 * - ALL fields are mandatory
 *
 * DESIGN PRINCIPLES:
 * - Draft-safe (auto-loads previously saved data)
 * - Keyboard-safe scrolling
 * - Explicit validation
 * - Toast feedback on save
 * - Light & dark mode compatible
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
 * Must exactly match the key used in:
 * - seaServiceSections.ts
 * - SeaServiceWizard.tsx
 */
const SECTION_KEY = "AUX_MACHINERY_ELECTRICAL";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */
export default function AuxMachineryElectricalSection() {
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
   * All values stored as strings for simplicity and consistency.
   */
  const [form, setForm] = useState({
    mainGeneratorsMakeModel: "",
    numberOfGenerators: "",
    generatorPowerOutput: "",
    emergencyGeneratorMakeModel: "",
    emergencyGeneratorPowerOutput: "",
    shaftGeneratorDetails: "",
    mainSupplyVoltageFrequency: "",
    lightingSupplyVoltage: "",
    boilerMakeType: "",
    boilerWorkingPressure: "",
    freshWaterGeneratorType: "",
    oilyWaterSeparatorMakeModel: "",
    sewageTreatmentPlantMakeModel: "",
    incineratorMake: "",
    purifiersMake: "",
    airCompressorsMakePressure: "",
  });

  /**
   * Populate draft data on first load
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
   * ALL fields in this section are mandatory.
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
     * IMPORTANT:
     * - This section is DRAFT-SAFE
     * - Partial data MUST be allowed to save
     * - Completion is decided ONLY in SeaServiceWizard
     */

    updateSection(SECTION_KEY, form);

    if (isFormValid) {
        toast.success(
        "Auxiliary machinery & electrical section completed."
        );
    } else {
        toast.info(
        "Auxiliary machinery details saved as draft."
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
        Auxiliary Machinery & Electrical
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter auxiliary engine room and electrical system details.
        All fields are mandatory.
      </Text>

      <Divider style={styles.divider} />

      {/* ---------------- GENERATORS ---------------- */}
      <TextInput
        label="Main Generators Make & Model"
        value={form.mainGeneratorsMakeModel}
        onChangeText={(v) =>
          handleChange("mainGeneratorsMakeModel", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Number of Generators"
        value={form.numberOfGenerators}
        onChangeText={(v) =>
          handleChange("numberOfGenerators", v)
        }
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Generator Power Output (kW / kVA)"
        value={form.generatorPowerOutput}
        onChangeText={(v) =>
          handleChange("generatorPowerOutput", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- EMERGENCY & SHAFT ---------------- */}
      <TextInput
        label="Emergency Generator Make & Model"
        value={form.emergencyGeneratorMakeModel}
        onChangeText={(v) =>
          handleChange("emergencyGeneratorMakeModel", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Emergency Generator Power Output (kW)"
        value={form.emergencyGeneratorPowerOutput}
        onChangeText={(v) =>
          handleChange("emergencyGeneratorPowerOutput", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Shaft Generator (Yes / No & Capacity)"
        value={form.shaftGeneratorDetails}
        onChangeText={(v) =>
          handleChange("shaftGeneratorDetails", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- ELECTRICAL SUPPLY ---------------- */}
      <TextInput
        label="Main Supply Voltage / Frequency (e.g. 440V / 60Hz)"
        value={form.mainSupplyVoltageFrequency}
        onChangeText={(v) =>
          handleChange("mainSupplyVoltageFrequency", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Lighting Supply Voltage (e.g. 220V / 110V)"
        value={form.lightingSupplyVoltage}
        onChangeText={(v) =>
          handleChange("lightingSupplyVoltage", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- BOILERS & WATER ---------------- */}
      <TextInput
        label="Boiler Make & Type"
        value={form.boilerMakeType}
        onChangeText={(v) =>
          handleChange("boilerMakeType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Boiler Working Pressure"
        value={form.boilerWorkingPressure}
        onChangeText={(v) =>
          handleChange("boilerWorkingPressure", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Fresh Water Generator Type"
        value={form.freshWaterGeneratorType}
        onChangeText={(v) =>
          handleChange("freshWaterGeneratorType", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- ENVIRONMENTAL ---------------- */}
      <TextInput
        label="Oily Water Separator Make & Model"
        value={form.oilyWaterSeparatorMakeModel}
        onChangeText={(v) =>
          handleChange("oilyWaterSeparatorMakeModel", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Sewage Treatment Plant Make & Model"
        value={form.sewageTreatmentPlantMakeModel}
        onChangeText={(v) =>
          handleChange("sewageTreatmentPlantMakeModel", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Incinerator Make"
        value={form.incineratorMake}
        onChangeText={(v) =>
          handleChange("incineratorMake", v)
        }
        mode="outlined"
        style={styles.input}
      />

      {/* ---------------- AIR & PURIFIERS ---------------- */}
      <TextInput
        label="Purifiers Make (Fuel / Lube)"
        value={form.purifiersMake}
        onChangeText={(v) =>
          handleChange("purifiersMake", v)
        }
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Air Compressors Make & Pressure"
        value={form.airCompressorsMakePressure}
        onChangeText={(v) =>
          handleChange("airCompressorsMakePressure", v)
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
