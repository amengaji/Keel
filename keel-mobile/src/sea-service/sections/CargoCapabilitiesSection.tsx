//keel-mobile/src/sea-service/sections/CargoCapabilitiesSection.tsx

/**
 * ============================================================
 * Sea Service — Cargo Capabilities Section
 * ============================================================
 *
 * PURPOSE:
 * - Render cargo capability fields dynamically
 *   based on selected ship type
 *
 * RULES:
 * - Draft-safe (partial save allowed)
 * - Completion handled ONLY in SeaServiceWizard
 * - Sticky Save bar (correct height)
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
 * ------------------------------------------------------------
 * MAP SHIP TYPE → CARGO PROFILE
 * ------------------------------------------------------------
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
    const normalizedShipType = payload.shipType ?? undefined;
    return mapShipTypeToCargoProfile(normalizedShipType) ?? undefined;
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
    payload.sections?.[
      SECTION_KEY as keyof typeof payload.sections
    ] || {};

  /**
   * ------------------------------------------------------------
   * LOCAL FORM STATE
   * ------------------------------------------------------------
   */
  const [form, setForm] = useState<Record<string, any>>({});

  /**
   * Initialise form when profile loads
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
   * FIELD UPDATE
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
   * SAVE (DRAFT SAFE)
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
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
        >
          <Text variant="headlineSmall" style={styles.title}>
            Cargo Capabilities
          </Text>

          <HelperText type="error" visible>
            Cargo profile could not be determined for the selected ship type.
          </HelperText>
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* =====================================================
          SCROLLABLE CONTENT
          ===================================================== */}
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          {cargoProfile.title}
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          {cargoProfile.description}
        </Text>

        {cargoProfile.groups.map((group) => (
          <View key={group.groupKey} style={styles.groupBlock}>
            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.groupTitle}>
              {group.title}
            </Text>

            {group.description && (
              <Text
                variant="bodySmall"
                style={styles.groupDescription}
              >
                {group.description}
              </Text>
            )}

            {group.fields.map((field) => {
              const value = form[field.key];

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
                      field.uiType === "numeric"
                        ? "numeric"
                        : "default"
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                );
              }

              if (field.uiType === "switch") {
                return (
                  <View
                    key={field.key}
                    style={styles.switchRow}
                  >
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

              if (
                field.uiType === "dropdown" ||
                field.uiType === "radio"
              ) {
                return (
                  <View
                    key={field.key}
                    style={styles.segmentBlock}
                  >
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
      </KeyboardAwareScrollView>

      {/* =====================================================
          STICKY SAVE BAR
          ===================================================== */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button mode="contained" onPress={handleSave}>
          Save Section
        </Button>
      </View>
    </View>
  );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  content: {
    padding: 16,
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
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
