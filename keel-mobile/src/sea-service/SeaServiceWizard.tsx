//keel-mobile/src/sea-service/SeaServiceWizard.tsx

/**
 * ============================================================
 * Sea Service Wizard
 * ============================================================
 *
 * STEP 1: Ship Type Selection
 * STEP 2: Section Overview (filtered by ship type)
 * STEP 3+: Section Form Screens (one at a time)
 *
 * NOTE:
 * - Internal state-based navigation is used instead of
 *   global stack navigation for stability.
 * - Each section screen is independent and draft-safe.
 *
 * ANDROID NOTE:
 * - Android system navigation bar (Back / Home / Recents)
 *   can overlap full-screen views.
 * - SafeAreaInsets alone is NOT sufficient.
 * - We explicitly reserve footer space.
 */

import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, useTheme, Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SHIP_TYPES } from "../config/shipTypes";
import { SEA_SERVICE_SECTIONS } from "../config/seaServiceSections";
import { useSeaService } from "./SeaServiceContext";
import { useToast } from "../components/toast/useToast";
import PropulsionPerformanceSection from "./sections/PropulsionPerformanceSection";
import GeneralIdentitySection from "./sections/GeneralIdentitySection";
import DimensionsTonnageSection from "./sections/DimensionsTonnageSection";

/**
 * Wizard steps currently implemented.
 */
type WizardStep =
  | "SHIP_TYPE"
  | "SECTION_OVERVIEW"
  | "GENERAL_IDENTITY"
  | "DIMENSIONS_TONNAGE"
  | "PROPULSION_PERFORMANCE";

export default function SeaServiceWizard() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const { payload, setShipType } = useSeaService();

  /** Internal wizard step state */
  const [currentStep, setCurrentStep] =
    useState<WizardStep>("SHIP_TYPE");

  /**
   * ------------------------------------------------------------
   * ANDROID SYSTEM FOOTER SAFETY
   * ------------------------------------------------------------
   *
   * Why this exists:
   * - Android bottom navigation bar height is NOT guaranteed
   *   to be part of safe-area insets.
   * - We explicitly reserve space so content never overlaps.
   *
   * Rule:
   * - Always keep this applied to ScrollViews and section screens.
   */
  const androidSystemFooterPadding =
    Math.max(insets.bottom, 16) + 48;

  /**
   * ------------------------------------------------------------
   * STEP 1: Ship Type
   * ------------------------------------------------------------
   */
  const handleSelectShipType = (
    shipTypeCode: string,
    label: string
  ) => {
    setShipType(shipTypeCode);
    toast.success(
      `Ship type set to "${label}". Draft saved.`
    );
  };

  const handleNextFromShipType = () => {
    if (!payload.shipType) {
      toast.error("Please select a ship type first.");
      return;
    }
    setCurrentStep("SECTION_OVERVIEW");
  };

  /**
   * ------------------------------------------------------------
   * SECTION ENABLEMENT (BY SHIP TYPE)
   * ------------------------------------------------------------
   */
  const enabledSections = useMemo(() => {
    if (!payload.shipType) return [];

    const shipTypeConfig = SHIP_TYPES.find(
      (t) => t.code === payload.shipType
    );
    if (!shipTypeConfig) return [];

    return SEA_SERVICE_SECTIONS.filter((section) =>
      shipTypeConfig.enabledSections.includes(section.key)
    );
  }, [payload.shipType]);

  /**
   * ------------------------------------------------------------
   * SECTION OPEN HANDLER
   * ------------------------------------------------------------
   */
  const handleOpenSection = (
    sectionKey: string,
    title: string
  ) => {
    if (sectionKey === "GENERAL_IDENTITY") {
      setCurrentStep("GENERAL_IDENTITY");
      return;
    }

    if (sectionKey === "DIMENSIONS_TONNAGE") {
      setCurrentStep("DIMENSIONS_TONNAGE");
      return;
    }

      if (sectionKey === "PROPULSION_PERFORMANCE") {
        setCurrentStep("PROPULSION_PERFORMANCE");
        return;
    }

    toast.info(`"${title}" form will be added next.`);
  };

  /**
   * ============================================================
   * RENDER — STEP 1: SHIP TYPE
   * ============================================================
   */
  if (currentStep === "SHIP_TYPE") {
    return (
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: styles.content.paddingBottom + androidSystemFooterPadding },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Step 1: Select Ship Type
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Select the type of vessel you served on. This
          controls which Sea Service sections apply.
        </Text>

        <View style={styles.cardGrid}>
          {SHIP_TYPES.map((ship) => {
            const isSelected =
              payload.shipType === ship.code;

            return (
              <Card
                key={ship.code}
                style={[
                  styles.card,
                  isSelected && {
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  handleSelectShipType(
                    ship.code,
                    ship.label
                  )
                }
              >
                <Card.Content>
                  <Text
                    variant="titleMedium"
                    style={styles.cardTitle}
                  >
                    {ship.label}
                  </Text>

                  {isSelected && (
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.selectedText,
                        {
                          color:
                            theme.colors.primary,
                        },
                      ]}
                    >
                      Selected
                    </Text>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </View>

        <Button
          mode="contained"
          style={styles.nextButton}
          disabled={!payload.shipType}
          onPress={handleNextFromShipType}
        >
          Next
        </Button>
      </ScrollView>
    );
  }

  /**
   * ============================================================
   * RENDER — STEP 3: GENERAL IDENTITY
   * ============================================================
   */
  if (currentStep === "GENERAL_IDENTITY") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Button
            mode="outlined"
            onPress={() =>
              setCurrentStep("SECTION_OVERVIEW")
            }
          >
            Back to Sections
          </Button>

          <Button
            mode="text"
            onPress={() =>
              toast.info(
                "Remember to tap Save Section before leaving."
              )
            }
          >
            Help
          </Button>
        </View>

        <Divider />

        <GeneralIdentitySection />
      </View>
    );
  }

  /**
   * ============================================================
   * RENDER — STEP 4: DIMENSIONS & TONNAGES
   * ============================================================
   */
  if (currentStep === "DIMENSIONS_TONNAGE") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Button
            mode="outlined"
            onPress={() =>
              setCurrentStep("SECTION_OVERVIEW")
            }
          >
            Back to Sections
          </Button>

          <Button
            mode="text"
            onPress={() =>
              toast.info(
                "Remember to tap Save Section before leaving."
              )
            }
          >
            Help
          </Button>
        </View>

        <Divider />

        <DimensionsTonnageSection />
      </View>
    );
  }

    /**
     * ============================================================
     * RENDER — STEP 5: PROPULSION & PERFORMANCE
     * ============================================================
     */
    if (currentStep === "PROPULSION_PERFORMANCE") {
    return (
        <View
        style={[
            styles.container,
            {
            backgroundColor: theme.colors.background,
            paddingBottom: androidSystemFooterPadding,
            },
        ]}
        >
        <View style={styles.sectionHeader}>
            <Button
            mode="outlined"
            onPress={() =>
                setCurrentStep("SECTION_OVERVIEW")
            }
            >
            Back to Sections
            </Button>

            <Button
            mode="text"
            onPress={() =>
                toast.info(
                "Remember to tap Save Section before leaving."
                )
            }
            >
            Help
            </Button>
        </View>

        <Divider />

        <PropulsionPerformanceSection />
        </View>
    );
    }


  /**
   * ============================================================
   * RENDER — STEP 2: SECTION OVERVIEW
   * ============================================================
   */
  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: styles.content.paddingBottom + androidSystemFooterPadding },
      ]}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Sea Service Sections
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Complete the sections below. You can save and
        return at any time.
      </Text>

      <View style={styles.cardGrid}>
        {enabledSections.map((section) => (
          <Card
            key={section.key}
            style={styles.card}
            onPress={() =>
              handleOpenSection(
                section.key,
                section.title
              )
            }
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                style={styles.cardTitle}
              >
                {section.title}
              </Text>

              <Text
                variant="bodySmall"
                style={styles.sectionDescription}
              >
                {section.description}
              </Text>

              {/* ------------------------------------------------
                  SECTION STATUS (DYNAMIC)
                  ------------------------------------------------ */}
              {(() => {
                const sectionData =
                  payload.sections[
                    section.key as keyof typeof payload.sections
                  ] || {};

                let status:
                  | "Not Started"
                  | "In Progress"
                  | "Completed" =
                  "Not Started";

                if (section.key === "GENERAL_IDENTITY") {
                  const {
                    shipName,
                    imoNumber,
                    flagState,
                    portOfRegistry,
                  } = sectionData as any;

                  if (
                    shipName &&
                    imoNumber &&
                    flagState &&
                    portOfRegistry
                  ) {
                    status = "Completed";
                  } else if (
                    shipName ||
                    imoNumber ||
                    flagState ||
                    portOfRegistry
                  ) {
                    status = "In Progress";
                  }
                }

                if (section.key === "DIMENSIONS_TONNAGE") {
                  const {
                    grossTonnage,
                    netTonnage,
                    deadweightTonnage,
                    loaMeters,
                    breadthMeters,
                    summerDraftMeters,
                  } = sectionData as any;

                  const allFilled =
                    grossTonnage &&
                    netTonnage &&
                    deadweightTonnage &&
                    loaMeters &&
                    breadthMeters &&
                    summerDraftMeters;

                  const anyFilled =
                    grossTonnage ||
                    netTonnage ||
                    deadweightTonnage ||
                    loaMeters ||
                    breadthMeters ||
                    summerDraftMeters;

                  if (allFilled) {
                    status = "Completed";
                  } else if (anyFilled) {
                    status = "In Progress";
                  }
                }
                
                if (section.key === "PROPULSION_PERFORMANCE") {
                const allFilled =
                    Object.values(sectionData).length > 0 &&
                    Object.values(sectionData).every(
                    (v) => String(v).trim() !== ""
                    );

                const anyFilled =
                    Object.values(sectionData).some(
                    (v) => String(v).trim() !== ""
                    );

                if (allFilled) {
                    status = "Completed";
                } else if (anyFilled) {
                    status = "In Progress";
                }
                }

                return (
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.sectionStatus,
                      status === "Completed" && {
                        color:
                          theme.colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    Status: {status}
                  </Text>
                );
              })()}
            </Card.Content>
          </Card>
        ))}
      </View>

      <Button
        mode="outlined"
        style={styles.backButton}
        onPress={() =>
          setCurrentStep("SHIP_TYPE")
        }
      >
        Change Ship Type
      </Button>
    </ScrollView>
  );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: "700", marginBottom: 8 },
  subtitle: { marginBottom: 20, opacity: 0.8 },
  cardGrid: { gap: 12 },
  card: { borderRadius: 8 },
  cardTitle: { fontWeight: "600", marginBottom: 4 },
  selectedText: { marginTop: 6, fontWeight: "600" },
  sectionDescription: {
    opacity: 0.7,
    marginBottom: 6,
  },
  sectionStatus: {
    fontWeight: "600",
    opacity: 0.8,
  },
  nextButton: { marginTop: 16 },
  backButton: { marginTop: 24 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
