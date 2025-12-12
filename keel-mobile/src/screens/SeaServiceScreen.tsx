//keel-mobile/src/screens/SeaServiceScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  TextInput,
} from "react-native-paper";

import DateInputField from "../components/inputs/DateInputField";

export default function SeaServiceScreen() {
  const theme = useTheme();

  const [showForm, setShowForm] = useState(false);

  const [signOnDate, setSignOnDate] = useState<Date | null>(null);
  const [signOffDate, setSignOffDate] = useState<Date | null>(null);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Sea Service
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Record and track your onboard service
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardRow}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Total Sea Days</Text>
            <Text variant="headlineSmall">—</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Current Vessel</Text>
            <Text variant="headlineSmall">—</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.cardRow}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Current Rank</Text>
            <Text variant="headlineSmall">—</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelMedium">Status</Text>
            <Text variant="headlineSmall">—</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Service Timeline
        </Text>

        <Card style={styles.timelineCard}>
          <Card.Content>
            <View style={styles.timelineHeader}>
              <Text variant="titleSmall">Vessel Name</Text>
              <Chip compact>Ongoing</Chip>
            </View>

            <Text variant="bodySmall">Rank: —</Text>
            <Text variant="bodySmall">Period: — → —</Text>
            <Text variant="bodySmall">Sea Days: —</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Add Button */}
      {!showForm && (
        <Button
          mode="contained"
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          Add Sea Service
        </Button>
      )}

      {/* Add Sea Service Form */}
      {showForm && (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.formTitle}>
              Add Sea Service
            </Text>

            <TextInput label="Vessel Name" mode="outlined" style={styles.input} />
            <TextInput label="IMO Number" mode="outlined" style={styles.input} />
            <TextInput label="Rank" mode="outlined" style={styles.input} />

            <DateInputField
              label="Sign-on Date"
              value={signOnDate}
              onChange={setSignOnDate}
              required
            />

            <View style={{ height: 12 }} />

            <DateInputField
              label="Sign-off Date (optional)"
              value={signOffDate}
              onChange={setSignOffDate}
            />

            <View style={{ height: 12 }} />

            <TextInput
              label="Company Name"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Remarks"
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <View style={styles.formActions}>
              <Button onPress={() => setShowForm(false)}>Cancel</Button>
              <Button mode="contained" onPress={() => {}}>
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
  },
  timelineCard: {
    marginBottom: 12,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  addButton: {
    marginTop: 16,
  },
  formCard: {
    marginTop: 20,
  },
  formTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  input: {
    marginBottom: 12,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
});
