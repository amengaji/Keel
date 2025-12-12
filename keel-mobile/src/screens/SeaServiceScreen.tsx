//keel-mobile/src/screens/SeaServiceScreen.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  TextInput,
} from "react-native-paper";

import DateInputField from "../components/inputs/DateInputField";

type SeaServiceEntry = {
  vesselName: string;
  rank: string;
  signOn: Date;
  signOff?: Date | null;
};

export default function SeaServiceScreen() {
  const theme = useTheme();

  const [entries, setEntries] = useState<SeaServiceEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [vesselName, setVesselName] = useState("");
  const [rank, setRank] = useState("");
  const [signOnDate, setSignOnDate] = useState<Date | null>(null);
  const [signOffDate, setSignOffDate] = useState<Date | null>(null);

  const isFormValid = vesselName && rank && signOnDate;

  const totalSeaDays = useMemo(() => {
    return entries.reduce((sum, e) => {
      const end = e.signOff ?? new Date();
      const diff =
        (end.getTime() - e.signOn.getTime()) / 86400000;
      return sum + Math.max(0, Math.floor(diff));
    }, 0);
  }, [entries]);

  const handleSave = () => {
    if (!isFormValid) return;

    setEntries((prev) => [
      ...prev,
      {
        vesselName,
        rank,
        signOn: signOnDate!,
        signOff: signOffDate,
      },
    ]);

    setVesselName("");
    setRank("");
    setSignOnDate(null);
    setSignOffDate(null);
    setShowForm(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
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

        {/* Summary */}
        <View style={styles.cardRow}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="labelMedium">Total Sea Days</Text>
              <Text variant="headlineSmall">{totalSeaDays}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="labelMedium">Entries</Text>
              <Text variant="headlineSmall">{entries.length}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Service Timeline
          </Text>

          {entries.map((e, idx) => (
            <Card key={idx} style={styles.timelineCard}>
              <Card.Content>
                <View style={styles.timelineHeader}>
                  <Text variant="titleSmall">{e.vesselName}</Text>
                  <Chip compact>{e.signOff ? "Completed" : "Ongoing"}</Chip>
                </View>
                <Text variant="bodySmall">Rank: {e.rank}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {!showForm && (
          <Button
            mode="contained"
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            Add Sea Service
          </Button>
        )}

        {showForm && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.formTitle}>
                Add Sea Service
              </Text>

              <TextInput
                label="Vessel Name"
                mode="outlined"
                value={vesselName}
                onChangeText={setVesselName}
                style={styles.input}
              />

              <TextInput
                label="Rank"
                mode="outlined"
                value={rank}
                onChangeText={setRank}
                style={styles.input}
              />

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

              <View style={styles.formActions}>
                <Button onPress={() => setShowForm(false)}>Cancel</Button>
                <Button
                  mode="contained"
                  disabled={!isFormValid}
                  onPress={handleSave}
                >
                  Save
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
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
    marginTop: 12,
  },
});
