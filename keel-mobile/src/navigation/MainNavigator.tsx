//keel-mobile/src/navigation/MainNavigator.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";

import BottomTabNavigator from "./BottomTabNavigator";
import AppHeader from "../components/layout/AppHeader";

import SeaServiceWizardScreen from "../screens/SeaServiceWizardScreen";
import TaskDetailsScreen from "../screens/TaskDetailsScreen";

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * ============================================================
 * MainNavigator
 * ============================================================
 *
 * This stack sits above Bottom Tabs.
 *
 * Screen Structure:
 * - MainTabs (contains AppHeader + bottom tabs)
 * - SeaServiceWizard (full-screen wizard, no AppHeader)
 */
export default function MainNavigator() {
  return (
<Stack.Navigator screenOptions={{ headerShown: false }}>
  {/* Normal app layout with AppHeader + Tabs */}
  <Stack.Screen name="MainTabs" component={MainLayout} />

  {/* Full-screen Sea Service wizard */}
  <Stack.Screen
    name="SeaServiceWizard"
    component={SeaServiceWizardScreen}
  />

  {/* Task Details (drill-down, inspector-safe) */}
  <Stack.Screen
    name="TaskDetails"
    component={TaskDetailsScreen}
  />
</Stack.Navigator>

  );
}

function MainLayout() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <BottomTabNavigator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
