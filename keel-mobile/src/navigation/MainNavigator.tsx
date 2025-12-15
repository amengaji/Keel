//keel-mobile/src/navigation/MainNavigator.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";

import BottomTabNavigator from "./BottomTabNavigator";
import AppHeader from "../components/layout/AppHeader";

import SeaServiceWizardScreen from "../screens/SeaServiceWizardScreen";

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

      {/* Full-screen wizard (separate screen, its own header) */}
      <Stack.Screen name="SeaServiceWizard" component={SeaServiceWizardScreen} />
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
