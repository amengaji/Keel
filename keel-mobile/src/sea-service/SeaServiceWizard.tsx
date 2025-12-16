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
import AuxMachineryElectricalSection from "./sections/AuxMachineryElectricalSection";
import DeckMachineryManeuveringSection from "./sections/DeckMachineryManeuveringSection";
import CargoCapabilitiesSection from "./sections/CargoCapabilitiesSection";
import NavigationCommunicationSection from "./sections/NavigationCommunicationSection";
import LifeSavingAppliancesSection from "./sections/LifeSavingAppliancesSection";
import FireFightingAppliancesSection from "./sections/FireFightingAppliancesSection";
import InertGasSystemSection from "./sections/InertGasSystemSection";

/**
 * Wizard steps currently implemented.
 */
type WizardStep =
  | "SHIP_TYPE"
  | "SECTION_OVERVIEW"
  | "GENERAL_IDENTITY"
  | "DIMENSIONS_TONNAGE"
  | "PROPULSION_PERFORMANCE"
  | "AUX_MACHINERY_ELECTRICAL"
  | "DECK_MACHINERY_MANEUVERING"
  | "CARGO_CAPABILITIES"
  | "NAVIGATION_COMMUNICATION"
  | "LIFE_SAVING_APPLIANCES"
  | "FIRE_FIGHTING_APPLIANCES"
  | "INERT_GAS_SYSTEM";




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
    
    if (sectionKey === "AUX_MACHINERY_ELECTRICAL") {
    setCurrentStep("AUX_MACHINERY_ELECTRICAL");
    return;
    }

    if (sectionKey === "DECK_MACHINERY_MANEUVERING") {
    setCurrentStep("DECK_MACHINERY_MANEUVERING");
    return;
    }
    if (sectionKey === "CARGO_CAPABILITIES") {
    setCurrentStep("CARGO_CAPABILITIES");
    return;
    }
    if (sectionKey === "NAVIGATION_COMMUNICATION") {
    setCurrentStep("NAVIGATION_COMMUNICATION");
    return;
    }
    if (sectionKey === "LIFE_SAVING_APPLIANCES") {
    setCurrentStep("LIFE_SAVING_APPLIANCES");
    return;
    }
    if (sectionKey === "FIRE_FIGHTING_APPLIANCES") {
    setCurrentStep("FIRE_FIGHTING_APPLIANCES");
    return;
    }
    if (sectionKey === "INERT_GAS_SYSTEM") {
    setCurrentStep("INERT_GAS_SYSTEM");
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
     * RENDER — STEP 6: AUXILIARY MACHINERY AND ELECTRICAL
     * ============================================================
     */
    if (currentStep === "AUX_MACHINERY_ELECTRICAL") {
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

            <AuxMachineryElectricalSection />
            </View>
        );
    }
    

    /**
     * ============================================================
     * RENDER — STEP 7: AUXILIARY MACHINERY AND ELECTRICAL
     * ============================================================
     */
    if (currentStep === "DECK_MACHINERY_MANEUVERING") {
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

            <DeckMachineryManeuveringSection />
            </View>
        );
    }

    /**
     * ============================================================
     * RENDER — STEP 8: CARGO CAPABILITIES
   * ============================================================
   */
  if (currentStep === "CARGO_CAPABILITIES") {
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

        <CargoCapabilitiesSection />
      </View>
    );
  }

  /**
 * ============================================================
 * RENDER — STEP 9: NAVIGATION & COMMUNICATION
 * ============================================================
 */
if (currentStep === "NAVIGATION_COMMUNICATION") {
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
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>

        <Button
          mode="text"
          onPress={() =>
            toast.info("Remember to tap Save Section before leaving.")
          }
        >
          Help
        </Button>
      </View>

      <Divider />

      <NavigationCommunicationSection />
    </View>
  );
}
    /**
     * ============================================================
     * RENDER — STEP 10: LIFE SAVING APPLIANCES (LSA)
     * ============================================================
     */
    if (currentStep === "LIFE_SAVING_APPLIANCES") {
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
            onPress={() => setCurrentStep("SECTION_OVERVIEW")}
            >
            Back to Sections
            </Button>

            <Button
            mode="text"
            onPress={() =>
                toast.info("Remember to tap Save Section before leaving.")
            }
            >
            Help
            </Button>
        </View>

        <Divider />

        <LifeSavingAppliancesSection />
        </View>
    );
    }

    /**
 * ============================================================
 * RENDER — STEP 11: FIRE FIGHTING APPLIANCES (FFA)
 * ============================================================
 */
if (currentStep === "FIRE_FIGHTING_APPLIANCES") {
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
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
        >
          Back to Sections
        </Button>

        <Button
          mode="text"
          onPress={() =>
            toast.info("Remember to tap Save Section before leaving.")
          }
        >
          Help
        </Button>
      </View>

      <Divider />

      <FireFightingAppliancesSection />
    </View>
  );
}
/**
 * ============================================================
 * RENDER — STEP 12: INERT GAS SYSTEM (IGS)
 * ============================================================
 */
if (currentStep === "INERT_GAS_SYSTEM") {
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
          onPress={() => setCurrentStep("SECTION_OVERVIEW")}
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

      <InertGasSystemSection />
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

                // ---------------- GENERAL IDENTITY ----------------
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

                // ---------------- DIMENSIONS ----------------
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

                // ---------------- PROPULSION ----------------
                if (section.key === "PROPULSION_PERFORMANCE") {
                    const values = Object.values(sectionData);

                    const allFilled =
                    values.length > 0 &&
                    values.every((v) => String(v).trim() !== "");

                    const anyFilled =
                    values.some((v) => String(v).trim() !== "");

                    if (allFilled) {
                    status = "Completed";
                    } else if (anyFilled) {
                    status = "In Progress";
                    }
                }

                // ---------------- AUX MACHINERY ----------------
                if (section.key === "AUX_MACHINERY_ELECTRICAL") {
                    const {
                    mainGeneratorsMakeModel,
                    numberOfGenerators,
                    generatorPowerOutput,
                    emergencyGeneratorMakeModel,
                    emergencyGeneratorPowerOutput,
                    shaftGeneratorDetails,
                    mainSupplyVoltageFrequency,
                    lightingSupplyVoltage,
                    boilerMakeType,
                    boilerWorkingPressure,
                    freshWaterGeneratorType,
                    oilyWaterSeparatorMakeModel,
                    sewageTreatmentPlantMakeModel,
                    incineratorMake,
                    purifiersMake,
                    airCompressorsMakePressure,
                    } = sectionData as any;

                    const allFilled =
                    mainGeneratorsMakeModel &&
                    numberOfGenerators &&
                    generatorPowerOutput &&
                    emergencyGeneratorMakeModel &&
                    emergencyGeneratorPowerOutput &&
                    shaftGeneratorDetails &&
                    mainSupplyVoltageFrequency &&
                    lightingSupplyVoltage &&
                    boilerMakeType &&
                    boilerWorkingPressure &&
                    freshWaterGeneratorType &&
                    oilyWaterSeparatorMakeModel &&
                    sewageTreatmentPlantMakeModel &&
                    incineratorMake &&
                    purifiersMake &&
                    airCompressorsMakePressure;

                    const anyFilled =
                    mainGeneratorsMakeModel ||
                    numberOfGenerators ||
                    generatorPowerOutput ||
                    emergencyGeneratorMakeModel ||
                    emergencyGeneratorPowerOutput ||
                    shaftGeneratorDetails ||
                    mainSupplyVoltageFrequency ||
                    lightingSupplyVoltage ||
                    boilerMakeType ||
                    boilerWorkingPressure ||
                    freshWaterGeneratorType ||
                    oilyWaterSeparatorMakeModel ||
                    sewageTreatmentPlantMakeModel ||
                    incineratorMake ||
                    purifiersMake ||
                    airCompressorsMakePressure;

                    if (allFilled) {
                    status = "Completed";
                    } else if (anyFilled) {
                    status = "In Progress";
                    }
                }

                // ---------------- DECK MACHINERY & MANEUVERING ----------------
                if (section.key === "DECK_MACHINERY_MANEUVERING") {
                const {
                    anchorWindlassMakeType,
                    mooringWinchesNumberType,
                    anchorPortTypeWeight,
                    anchorStarboardTypeWeight,
                    chainLengthPortShackles,
                    chainLengthStarboardShackles,
                    bowThrusterPowerMake,
                    sternThrusterPowerMake,
                    steeringGearMakeModelType,
                } = sectionData as any;

                const allFilled =
                    anchorWindlassMakeType &&
                    mooringWinchesNumberType &&
                    anchorPortTypeWeight &&
                    anchorStarboardTypeWeight &&
                    chainLengthPortShackles &&
                    chainLengthStarboardShackles &&
                    bowThrusterPowerMake &&
                    sternThrusterPowerMake &&
                    steeringGearMakeModelType;

                const anyFilled =
                    anchorWindlassMakeType ||
                    mooringWinchesNumberType ||
                    anchorPortTypeWeight ||
                    anchorStarboardTypeWeight ||
                    chainLengthPortShackles ||
                    chainLengthStarboardShackles ||
                    bowThrusterPowerMake ||
                    sternThrusterPowerMake ||
                    steeringGearMakeModelType;

                if (allFilled) {
                    status = "Completed";
                } else if (anyFilled) {
                    status = "In Progress";
                }
                }

                if (section.key === "CARGO_CAPABILITIES") {
                  /**
                   * Cargo Capabilities Status Logic
                   *
                   * RULES:
                   * - Fields are profile-driven (by ship type)
                   * - Wizard does NOT care about ship type here
                   * - Completion = all required fields filled
                   * - In Progress = any field filled
                   * - Empty = Not Started
                   */

                  const values = Object.values(sectionData || {}).map(
                    (v) => String(v).trim()
                  );

                  const anyFilled = values.some((v) => v !== "");
                  const allFilled =
                    values.length > 0 &&
                    values.every((v) => v !== "");

                  if (allFilled) {
                    status = "Completed";
                  } else if (anyFilled) {
                    status = "In Progress";
                  }
                }
                // ---------------- NAVIGATION & COMMUNICATION ----------------
                if (section.key === "NAVIGATION_COMMUNICATION") {
                    const {
                        gyroCompass,
                        magneticCompass,
                        radarXBand,
                        radarSBand,
                        ecdis,
                        gps,
                        echoSounder,
                        speedLog,
                        ais,
                        navtex,
                        gmdssArea,
                        vhf,
                        mfHf,
                        inmarsat,
                        satC,
                    } = sectionData as any;

                    /**
                     * COMPLETION RULES (MARINE-CORRECT):
                     *
                     * REQUIRED CORE NAV EQUIPMENT:
                     * - Gyro or Magnetic compass
                     * - At least one Radar
                     * - GPS
                     * - ECDIS
                     * - AIS
                     * - GMDSS (any area)
                     * - VHF
                     */

                    const coreNavigationSatisfied =
                        (gyroCompass || magneticCompass) &&
                        (radarXBand || radarSBand) &&
                        gps &&
                        ecdis &&
                        ais &&
                        gmdssArea &&
                        vhf;

                    const anyFilled = [
                        gyroCompass,
                        magneticCompass,
                        radarXBand,
                        radarSBand,
                        ecdis,
                        gps,
                        echoSounder,
                        speedLog,
                        ais,
                        navtex,
                        gmdssArea,
                        vhf,
                        mfHf,
                        inmarsat,
                        satC,
                    ].some((v) => String(v ?? "").trim() !== "");

                    if (coreNavigationSatisfied) {
                        status = "Completed";
                    } else if (anyFilled) {
                        status = "In Progress";
                    }
                }

                // ---------------- LIFE SAVING APPLIANCES ----------------
                if (section.key === "LIFE_SAVING_APPLIANCES") {
                    /**
                     * LIFE SAVING APPLIANCES STATUS LOGIC
                     *
                     * RULES (MARINE-CORRECT):
                     * - Section is large → completion is pragmatic, not perfectionist
                     * - Completed when CORE SOLAS items are present
                     * - In Progress when any LSA data is entered
                     */

                    const {
                        // Lifeboats
                        lifeboatsAvailable,
                        lifeboatType,
                        lifeboatCount,
                        lifeboatCapacity,

                        // Liferafts
                        liferaftsAvailable,
                        liferaftType,
                        liferaftCount,
                        liferaftCapacity,

                        // Distress & alerting
                        epirbType,
                        sartType,

                        // Distress signals
                        rocketFlaresAvailable,
                        handFlaresAvailable,
                        smokeSignalsAvailable,
                    } = sectionData as any;

                    const anyFilled =
                        lifeboatsAvailable ||
                        liferaftsAvailable ||
                        lifeboatType ||
                        lifeboatCount ||
                        lifeboatCapacity ||
                        liferaftType ||
                        liferaftCount ||
                        liferaftCapacity ||
                        epirbType ||
                        sartType ||
                        rocketFlaresAvailable ||
                        handFlaresAvailable ||
                        smokeSignalsAvailable;

                    /**
                     * CORE COMPLETION CRITERIA (AUDIT-SAFE):
                     * - At least ONE survival craft (LB or LR)
                     * - EPIRB present
                     * - SART present
                     */
                    const hasSurvivalCraft =
                        (lifeboatsAvailable &&
                        lifeboatType &&
                        lifeboatCount &&
                        lifeboatCapacity) ||
                        (liferaftsAvailable &&
                        liferaftType &&
                        liferaftCount &&
                        liferaftCapacity);

                    const distressReady = epirbType && sartType;

                    if (hasSurvivalCraft && distressReady) {
                        status = "Completed";
                    } else if (anyFilled) {
                        status = "In Progress";
                    }
                }

// ---------------- FIRE FIGHTING APPLIANCES ----------------
if (section.key === "FIRE_FIGHTING_APPLIANCES") {
  /**
   * FIRE FIGHTING APPLIANCES STATUS LOGIC (Wizard-only)
   *
   * GOALS:
   * - Backward compatible with legacy fields
   * - Understand new portable-extinguishers-by-type model
   * - Understand fixed-fire-systems-by-space + multi-system per space
   * - Keep “Completed” pragmatic and audit-defensible
   */

  const data = (sectionData ?? {}) as any;

  // ---------- Portable extinguishers (NEW + legacy support) ----------
  const portableAny =
    !!data.portableExtinguishersAvailable || // legacy (if still exists in old drafts)
    !!data.dcpExtinguishersAvailable ||
    !!data.co2ExtinguishersAvailable ||
    !!data.foamExtinguishersAvailable ||
    !!data.waterMistExtinguishersAvailable;

  // ---------- Fixed fire systems (NEW + legacy support) ----------
  // Legacy flag (old generic model)
  const fixedLegacyAny = !!data.fixedFireSystemAvailable;

  // Space toggles (new model)
  const fixedSpaceAny =
    !!data.engineRoomFixedAvailable ||
    !!data.pumpRoomFixedAvailable ||
    !!data.cargoFixedAvailable ||
    !!data.accommodationFixedAvailable ||
    !!data.galleyFixedAvailable ||
    !!data.paintLockerFixedAvailable ||
    !!data.chemicalLockerFixedAvailable;

  // Any actual fixed-system selection (new model, per-system checkboxes)
  const fixedSelectedAny =
    // Engine Room
    !!data.engineRoomFixedCO2Available ||
    !!data.engineRoomFixedWaterMistAvailable ||
    !!data.engineRoomFixedLocalAppAvailable ||
    !!data.engineRoomFixedFoamLowExpAvailable ||
    // Pump Room
    !!data.pumpRoomFixedHighExpFoamAvailable ||
    !!data.pumpRoomFixedLowExpFoamAvailable ||
    !!data.pumpRoomFixedWaterSprayAvailable ||
    !!data.pumpRoomFixedCO2Available ||
    // Cargo / Deck
    !!data.cargoFixedLowExpFoamAvailable ||
    !!data.cargoFixedDCPAvailable ||
    !!data.cargoFixedWaterSprayAvailable ||
    !!data.cargoFixedCO2Available ||
    // Accommodation
    !!data.accommodationFixedSprinklerAvailable ||
    !!data.accommodationFixedWaterMistAvailable ||
    // Galley
    !!data.galleyFixedWetChemicalAvailable ||
    !!data.galleyFixedWaterMistAvailable ||
    !!data.galleyFixedCO2Available ||

    // Paint Locker
    !!data.paintLockerFixedCO2Available ||
    !!data.paintLockerFixedWaterSprayAvailable ||
    !!data.paintLockerFixedFoamAvailable ||
    // Chemical / Flammable Locker
    !!data.chemicalLockerFixedCO2Available ||
    !!data.chemicalLockerFixedWaterSprayAvailable ||
    !!data.chemicalLockerFixedFoamAvailable;

  // We treat fixed systems as “present” if legacy says so OR any new selections exist OR a space has been marked.
  // (Marking a space without selecting a system still counts as “in progress”.)
  const fixedAny = fixedLegacyAny || fixedSelectedAny || fixedSpaceAny;

  // ---------- Any-filled (for In Progress) ----------
  const anyFilled =
    !!data.fireMainAvailable ||
    !!data.emergencyFirePumpAvailable ||
    !!data.hydrantsAvailable ||
    !!data.hosesAvailable ||
    portableAny ||
    fixedAny ||
    !!data.fireDetectionAlarmAvailable ||
    !!data.firemansOutfitAvailable ||
    !!data.breathingApparatusAvailable ||
    !!data.eebdAvailable ||
    !! (typeof data.remarks === "string" && data.remarks.trim().length > 0)

  // ---------- Core completion (pragmatic SOLAS-aligned) ----------
  /**
   * CORE COMPLETION CRITERIA:
   * - Fire main OR any fixed system documented (legacy or new)
   * - Portable extinguishers documented (any type)
   * - Fire detection/alarm documented
   * - Fireman’s outfit OR BA documented
   */
  const coreFireProtection =
    (!!data.fireMainAvailable || fixedLegacyAny || fixedSelectedAny) &&
    portableAny &&
    !!data.fireDetectionAlarmAvailable &&
    (!!data.firemansOutfitAvailable || !!data.breathingApparatusAvailable);

  if (coreFireProtection) {
    status = "Completed";
  } else if (anyFilled) {
    status = "In Progress";
  }
}
// ---------------- INERT GAS SYSTEM ----------------
if (section.key === "INERT_GAS_SYSTEM") {
  const data = sectionData || {};
  const shipType = payload?.shipType || "";

  const isTanker =
    shipType === "TANKER" ||
    shipType === "OIL_TANKER" ||
    shipType === "PRODUCT_TANKER" ||
    shipType === "CHEMICAL_TANKER";

  // ---- NOT FITTED PATH ----
  if (!data.igsFitted) {
    if (
      !isTanker &&
      typeof data.igsNotFittedReason === "string" &&
      data.igsNotFittedReason.trim().length > 0
    ) {
      status = "Completed";
    } else if (
      typeof data.igsNotFittedReason === "string" &&
      data.igsNotFittedReason.trim().length > 0
    ) {
      status = "In Progress";
    }
  }

  // ---- FITTED PATH ----
  if (data.igsFitted) {
    const coreComponents =
      data.scrubberAvailable ||
      data.blowerAvailable ||
      data.deckSealAvailable ||
      data.nonReturnDevicesAvailable;

    const monitoring =
      data.oxygenAnalyzerAvailable ||
      data.igPressureAlarmAvailable ||
      data.deckSealAlarmAvailable ||
      data.blowerTripAvailable ||
      data.highOxygenTripAvailable;

    const anyFilled =
      coreComponents ||
      monitoring ||
      data.distCargoTanks ||
      data.distSlopTanks ||
      data.distCargoLines ||
      data.distMastRiser ||
      (typeof data.igsSourceType === "string" &&
        data.igsSourceType.trim().length > 0);

    if (coreComponents && monitoring) {
      status = "Completed";
    } else if (anyFilled) {
      status = "In Progress";
    }
  }
}



                // ---------------- STATUS COLOR (VISUAL ONLY) ----------------
                const getStatusStyle = (): {
                color?: string;
                fontWeight?: 400 | 500 | 600 | 700;
                } => {
                switch (status) {
                    case "Completed":
                    return {
                        color: "#2E7D32", // Green
                        fontWeight: 700,
                    };
                    case "In Progress":
                    return {
                        color: "#EF6C00", // Orange
                        fontWeight: 600,
                    };
                    case "Not Started":
                    return {
                        color: "#C62828", // Red
                        fontWeight: 600,
                    };
                    default:
                    return {};
                }
                };


                return (
                    <Text
                    variant="labelSmall"
                    style={[
                        styles.sectionStatus,
                        getStatusStyle(),
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
