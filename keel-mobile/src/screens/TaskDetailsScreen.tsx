import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelButton } from "../components/ui/KeelButton";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "TaskDetails">;

export default function TaskDetailsScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <KeelScreen>
      <Text variant="titleLarge" style={{ fontWeight: "700" }}>
        Task {id}
      </Text>

      <Text variant="bodyMedium" style={styles.desc}>
        Lorem ipsum task description... (replace with real backend)
      </Text>

      <View style={styles.bottom}>
        <KeelButton mode="primary" onPress={() => console.log("Submit")}>
          Submit for CTO Review
        </KeelButton>
      </View>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  desc: {
    marginTop: 12,
    color: "#6B7280",
  },
  bottom: {
    marginTop: "auto",
  },
});
