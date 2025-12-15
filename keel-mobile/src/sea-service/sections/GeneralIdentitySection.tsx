//keel-mobile/src/sea-service/sections/GeneralIdentitySection.tsx

/**
 * ============================================================
 * General Identity & Registry Section
 * ============================================================
 *
 * This screen captures BASIC vessel identity details.
 *
 * DESIGN PRINCIPLES:
 * - Partial save allowed
 * - No heavy validation yet
 * - Safe for exit & resume
 * - Reads/writes ONLY to SeaServiceContext
 *
 * This is the FIRST real Sea Service form.
 */

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Divider,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

/**
 * ============================================================
 * GeneralIdentitySection
 * ============================================================
 */
export default function GeneralIdentitySection() {
  const theme = useTheme();
  const toast = useToast();

  const { payload, updateSection } = useSeaService();

  /**
   * Load existing values from context (if resuming)
   */
  const existing =
    payload.sections.GENERAL_IDENTITY ?? {};

  /**
   * Local form state
   * ----------------
   * We keep local state so user can type freely.
   * On Save, we commit to context.
   */
  const [shipName, setShipName] = useState(
    existing.shipName ?? ""
  );
  const [imoNumber, setImoNumber] = useState(
    existing.imoNumber ?? ""
  );
  const [callSign, setCallSign] = useState(
    existing.callSign ?? ""
  );
  const [flagState, setFlagState] = useState(
    existing.flagState ?? ""
  );
  const [portOfRegistry, setPortOfRegistry] = useState(
    existing.portOfRegistry ?? ""
  );

  /**
   * Save handler
   * ------------
   * Commits data into SeaServiceContext
   */
  const handleSave = () => {
    updateSection("GENERAL_IDENTITY", {
      shipName,
      imoNumber,
      callSign,
      flagState,
      portOfRegistry,
    });

    toast.success(
      "General Identity details saved."
    );
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
      General Identity & Registry
    </Text>

    <Text variant="bodyMedium" style={styles.subtitle}>
      Enter basic identification details of the vessel.
      You can save and return later.
    </Text>

    <Divider style={styles.divider} />

    <TextInput
      label="Ship Name"
      value={shipName}
      onChangeText={setShipName}
      mode="outlined"
      style={styles.input}
    />

    <TextInput
      label="IMO Number"
      value={imoNumber}
      onChangeText={setImoNumber}
      mode="outlined"
      keyboardType="numeric"
      style={styles.input}
    />

    <TextInput
      label="Call Sign"
      value={callSign}
      onChangeText={setCallSign}
      mode="outlined"
      style={styles.input}
    />

    <TextInput
      label="Flag State"
      value={flagState}
      onChangeText={setFlagState}
      mode="outlined"
      style={styles.input}
    />

    <TextInput
      label="Port of Registry"
      value={portOfRegistry}
      onChangeText={setPortOfRegistry}
      mode="outlined"
      style={styles.input}
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

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
