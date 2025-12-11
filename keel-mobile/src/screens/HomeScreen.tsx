//keel-mobile/src/screens/HomeScreen.tsx
console.log(">>> HOME SCREEN <<<");
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { KeelScreen } from "../components/ui/KeelScreen";
import { ProgressCard } from "../components/home/ProgressCard";
import { PendingTasksCard } from "../components/home/PendingTasksCard";
import { VesselCard } from "../components/home/VesselCard";
import { QuickActionsRow } from "../components/home/QuickActionsRow";
import { useAuth } from "../auth/AuthContext";

export default function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // Fake numbers, will replace with API
  const completed = 12;
  const total = 40;
  const pending = 5;

  return (
    <KeelScreen>
      <View>
        <Text variant="titleLarge" style={{ fontWeight: "700" }}>
          Hello, {user?.name || "Cadet"}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Keep up your training and stay compliant.
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <ProgressCard completed={completed} total={total} />

        <PendingTasksCard 
          count={pending}
          onPress={() => console.log("Go to tasks")}
        />

        <VesselCard vesselName="MT Horizon Star" shipType="Oil/Chemical Tanker" />

        <QuickActionsRow
          actions={[
            { icon: "note-edit-outline", label: "Tasks", onPress: () => console.log("Tasks") },
            { icon: "account-check-outline", label: "Sign-off", onPress: () => {} },
            { icon: "progress-clock", label: "Progress", onPress: () => {} },
          ]}
        />
      </View>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 4,
    color: "#6B7280",
  },
});
