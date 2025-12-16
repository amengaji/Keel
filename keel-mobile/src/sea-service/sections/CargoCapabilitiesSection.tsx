//keel-mobile/src/sea-service/sections/CargoCapabilitiesSection.tsx

/**
 * ============================================================
 * Sea Service — Cargo Capabilities Section
 * ============================================================
 *
 * PURPOSE:
 * - Render cargo capability fields dynamically
 *   based on selected ship type
 * - Support grouped config (Cargo / Load Line / Tanks)
 *
 * DESIGN RULES (CRITICAL):
 * - Draft-safe: partial save ALWAYS allowed
 * - Completion decided ONLY in SeaServiceWizard
 * - UI renders ONLY applicable cargo fields
 * - Keyboard-safe on Android & iOS
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  HelperText,
  Switch,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

import {
  CARGO_PROFILES,
  CargoProfileKey,
  CargoFieldDefinition,
  CargoFieldGroup,
} from "../../config/cargoProfiles";

/**
 * Section key used by SeaServiceWizard
 */
const SECTION_KEY = "CARGO_CAPABILITIES";

/**
 * ============================================================
 * HELPER — MAP SHIP TYPE → CARGO PROFILE
 * ============================================================
 */
function mapShipTypeToCargoProfile(
  shipType?: string
): CargoProfileKey | null {
  switch (shipType) {
    case "BULK_CARRIER":
      return "BULK";
    case "OIL_TANKER":
    case "CHEMICAL_TANKER":
      return "LIQUID_TANKER";
    case "GAS_TANKER":
      return "GAS_TANKER";
    case "CONTAINER":
      return "CONTAINER";
    case "CAR_CARRIER":
      return "CAR_CARRIER";
    case "RO_RO":
      return "RO_RO";
    case "GENERAL_CARGO":
      return "GENERAL";
    case "PASSENGER":
      return "PASSENGER";
    default:
      return null;
  }
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */
export default function CargoCapabilitiesSection() {
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * ------------------------------------------------------------
   * PROFILE RESOLUTION
   * ------------------------------------------------------------
   */
    const cargoProfileKey: CargoProfileKey | undefined = useMemo(() => {
    /**
     * IMPORTANT:
     * - payload.shipType may be null
     * - mapShipTypeToCargoProfile expects string | undefined
     * - Normalize null → undefined explicitly for strict TS safety
     */
    const normalizedShipType =
        payload.shipType ?? undefined;

    const profile =
        mapShipTypeToCargoProfile(normalizedShipType);

    return profile ?? undefined;
    }, [payload.shipType]);


  const cargoProfile = cargoProfileKey
    ? CARGO_PROFILES[cargoProfileKey]
    : null;

  /**
   * ------------------------------------------------------------
   * LOAD EXISTING DRAFT
   * ------------------------------------------------------------
   */
  const existingData =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   */
  const [form, setForm] = useState<Record<string, any>>({});

  /**
   * Initialize form when profile or draft changes
   */
  useEffect(() => {
    if (!cargoProfile) return;

    const initialState: Record<string, any> = {};

    cargoProfile.groups.forEach((group: CargoFieldGroup) => {
      group.fields.forEach((field: CargoFieldDefinition) => {
        initialState[field.key] =
          (existingData as any)[field.key] ?? "";
      });
    });

    setForm(initialState);
  }, [cargoProfileKey]);

  /**
   * ------------------------------------------------------------
   * FIELD CHANGE HANDLER
   * ------------------------------------------------------------
   */
  const updateField = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * ------------------------------------------------------------
   * SAVE HANDLER (DRAFT SAFE)
   * ------------------------------------------------------------
   */
  const handleSave = () => {
    updateSection(SECTION_KEY, form);
    toast.info("Cargo capabilities saved as draft.");
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  if (!cargoProfile) {
    return (
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Cargo Capabilities
        </Text>

        <HelperText type="error" visible>
          Cargo profile could not be determined for the selected ship type.
        </HelperText>
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={24}
    >
      <Text variant="headlineSmall" style={styles.title}>
        {cargoProfile.title}
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        {cargoProfile.description}
      </Text>

      {/* ================= GROUPS ================= */}
      {cargoProfile.groups.map((group) => (
        <View key={group.groupKey} style={styles.groupBlock}>
          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.groupTitle}>
            {group.title}
          </Text>

          {group.description && (
            <Text variant="bodySmall" style={styles.groupDescription}>
              {group.description}
            </Text>
          )}

          {group.fields.map((field) => {
            const value = form[field.key];

            /* ---------- TEXT / NUMERIC ---------- */
            if (field.uiType === "text" || field.uiType === "numeric") {
              return (
                <TextInput
                  key={field.key}
                  label={field.label}
                  value={String(value ?? "")}
                  onChangeText={(v) =>
                    updateField(field.key, v)
                  }
                  keyboardType={
                    field.uiType === "numeric" ? "numeric" : "default"
                  }
                  mode="outlined"
                  style={styles.input}
                />
              );
            }

            /* ---------- SWITCH ---------- */
            if (field.uiType === "switch") {
              return (
                <View key={field.key} style={styles.switchRow}>
                  <Text>{field.label}</Text>
                  <Switch
                    value={Boolean(value)}
                    onValueChange={(v) =>
                      updateField(field.key, v)
                    }
                  />
                </View>
              );
            }

            /* ---------- DROPDOWN / RADIO ---------- */
            if (
              field.uiType === "dropdown" ||
              field.uiType === "radio"
            ) {
              return (
                <View key={field.key} style={styles.segmentBlock}>
                  <Text style={styles.segmentLabel}>
                    {field.label}
                  </Text>
                  <SegmentedButtons
                    value={String(value ?? "")}
                    onValueChange={(v) =>
                      updateField(field.key, v)
                    }
                    buttons={(field.options ?? []).map(
                      (opt) => ({
                        value: opt,
                        label: opt,
                      })
                    )}
                  />
                </View>
              );
            }

            return null;
          })}
        </View>
      ))}

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
    paddingBottom: 40,
  },
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },
  groupBlock: {
    marginBottom: 20,
  },
  groupTitle: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  groupDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  segmentBlock: {
    marginBottom: 14,
  },
  segmentLabel: {
    marginBottom: 6,
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 24,
  },
});
